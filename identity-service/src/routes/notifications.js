const moment = require('moment')
const {
  handleResponse,
  successResponse,
  errorResponseBadRequest
} = require('../apiHelpers')
const models = require('../models')
const authMiddleware = require('../authMiddleware')

const NotificationType = Object.freeze({
  Follow: 'Follow',
  Repost: 'Repost',
  Favorite: 'Favorite',
  FavoriteTrack: 'FavoriteTrack',
  FavoritePlaylist: 'FavoritePlaylist',
  FavoriteAlbum: 'FavoriteAlbum',
  RepostTrack: 'RepostTrack',
  RepostPlaylist: 'RepostPlaylist',
  RepostAlbum: 'RepostAlbum',
  CreateTrack: 'CreateTrack',
  CreateAlbum: 'CreateAlbum',
  CreatePlaylist: 'CreatePlaylist',
  Announcement: 'Announcement',
  UserSubscription: 'UserSubscription',
  Milestone: 'Milestone',
  MilestoneRepost: 'MilestoneRepost',
  MilestoneFavorite: 'MilestoneFavorite',
  MilestoneListen: 'MilestoneListen',
  MilestoneFollow: 'MilestoneFollow'
})

const ClientNotificationTypes = new Set([
  NotificationType.Follow,
  NotificationType.Repost,
  NotificationType.Favorite,
  NotificationType.Announcement,
  NotificationType.UserSubscription,
  NotificationType.Milestone
])

const Entity = Object.freeze({
  Track: 'Track',
  Playlist: 'Playlist',
  Album: 'Album',
  User: 'User'
})

const Achievement = Object.freeze({
  Listens: 'Listens',
  Reposts: 'Reposts',
  Favorite: 'Favorites',
  Trending: 'Trending',
  Plays: 'Plays',
  Followers: 'Followers'
})

const formatUserSubscriptionCollection = entityType => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType,
    entityOwnerId: notification.actions[0].actionEntityId,
    entityIds: [notification.entityId],
    userId: notification.actions[0].actionEntityId,
    type: NotificationType.UserSubscription
  }
}

const formatUserSubscriptionTrack = notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType: Entity.Track,
    entityOwnerId: notification.entityId,
    entityIds: notification.actions.map(action => action.actionEntityId),
    userId: notification.entityId,
    type: NotificationType.UserSubscription
  }
}

const formatFavorite = (entityType) => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    type: NotificationType.Favorite,
    entityType,
    entityId: notification.entityId,
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const formatRepost = entityType => notification => {
  return {
    ...getCommonNotificationsFields(notification),
    entityType,
    entityId: notification.entityId,
    type: NotificationType.Repost,
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const formatFollow = (notification) => {
  return {
    ...getCommonNotificationsFields(notification),
    type: NotificationType.Follow,
    userIds: notification.actions.map(action => action.actionEntityId)
  }
}

const formatAnnouncement = (notification, announcements) => {
  const announcementIdx = announcements.findIndex(a => a.entityId === notification.entityId)
  if (announcementIdx === -1) return null
  const announcement = announcements[announcementIdx]
  return {
    ...getCommonNotificationsFields(notification),
    ...announcement,
    id: announcement.entityId,
    timestamp: announcement.datePublished,
    type: NotificationType.Announcement
  }
}

const formatUnreadAnnouncement = (announcement) => {
  return {
    ...announcement,
    id: announcement.entityId,
    isHidden: false,
    isRead: false,
    timestamp: announcement.datePublished,
    type: NotificationType.Announcement
  }
}

const mapMilestone = {
  [NotificationType.MilestoneRepost]: {
    achievement: Achievement.Reposts
  },
  [NotificationType.MilestoneFavorite]: {
    achievement: Achievement.Favorite
  },
  [NotificationType.MilestoneListen]: {
    achievement: Achievement.Listens
  },
  [NotificationType.MilestoneFollow]: {
    achievement: Achievement.Followers
  }
}

const formatMilestone = (notification) => {
  return {
    ...getCommonNotificationsFields(notification),
    ...mapMilestone[notification.type],
    type: NotificationType.Milestone,
    entityType: notification.actions[0].actionEntityType,
    entityId: notification.entityId,
    value: notification.actions[0].actionEntityId
  }
}

const getCommonNotificationsFields = (notification) => ({
  id: notification.id,
  isHidden: notification.isHidden,
  isRead: notification.isRead,
  timestamp: notification.timestamp
})

const notificationResponseMap = {
  [NotificationType.Follow]: formatFollow,
  [NotificationType.FavoriteTrack]: formatFavorite(Entity.Track),
  [NotificationType.FavoritePlaylist]: formatFavorite(Entity.Playlist),
  [NotificationType.FavoriteAlbum]: formatFavorite(Entity.Album),
  [NotificationType.RepostTrack]: formatRepost(Entity.Track),
  [NotificationType.RepostPlaylist]: formatRepost(Entity.Playlist),
  [NotificationType.RepostAlbum]: formatRepost(Entity.Album),
  [NotificationType.CreateTrack]: formatUserSubscriptionTrack,
  [NotificationType.CreateAlbum]: formatUserSubscriptionCollection(Entity.Album),
  [NotificationType.CreatePlaylist]: formatUserSubscriptionCollection(Entity.Playlist),
  [NotificationType.Announcement]: formatAnnouncement,
  [NotificationType.MilestoneRepost]: formatMilestone,
  [NotificationType.MilestoneFavorite]: formatMilestone,
  [NotificationType.MilestoneListen]: formatMilestone,
  [NotificationType.MilestoneFollow]: formatMilestone
}

/* Merges the notifications with the user announcements in time sorted order (Most recent first).
 *
 * @param {Array<Notification>} notifications   Notifications return from the db query w/ the actions
 * @param {Array<Announcement>} announcements   Announcements set on the app
 *
 * @return {Array<Notification|Announcement>} The merged & nsorted notificaitons/annoucnements
 */
const mergeAudiusAnnoucements = (announcements, notifications) => {
  const allNotifications = announcements.concat(notifications)
  allNotifications.sort((a, b) => {
    let aDate = moment(a.datePublished || a.timestamp)
    let bDate = moment(b.datePublished || b.timestamp)
    return bDate - aDate
  })
  return allNotifications
}

/* Merges the notifications with the user announcements in time sorted order.
 * Formats each notification to be send to the client.
 * Counts the total number of unread notifications
 *
 * @param {Array<Notification>} notifications   Notifications return from the db query w/ the actions
 * @param {Array<Announcement>} announcements   Announcements set on the app
 *
 * @return {object} The sorted & formated notificaitons/annoucnements and the total unread count for notifs & announcements
 */
const formatNotifications = (notifications, announcements) => {
  const userAnnouncements = [...announcements]
  const userNotifications = notifications.map((notification) => {
    const mapResponse = notificationResponseMap[notification.type]
    if (mapResponse) return mapResponse(notification, userAnnouncements)
  }).filter(Boolean)

  const notifIds = userNotifications.reduce((acc, notif) => {
    acc[notif.id] = true
    return acc
  }, {})

  const unreadAnnouncements = userAnnouncements
    .filter(a => !notifIds[a.entityId])
    .map(formatUnreadAnnouncement)

  return mergeAudiusAnnoucements(unreadAnnouncements, userNotifications)
}

module.exports = function (app) {
  /*
   * Fetches the notifications for the specified userId
   * urlQueryParam: {number} limit        Max number of notifications to return, Cannot exceed 100
   * urlQueryParam: {number?} timeOffset  A timestamp reference offset for fetch notification before this date
   *
   * TODO: Validate userId
   * NOTE: The `createdDate` param can/should be changed to the user sending their wallet &
   * finding the created date from the users table
  */
  app.get('/notifications', authMiddleware, handleResponse(async (req) => {
    const limit = parseInt(req.query.limit)
    const timeOffset = req.query.timeOffset ? moment(req.query.timeOffset) : moment()
    const { blockchainUserId: userId, createdAt } = req.user
    const createdDate = moment(createdAt)

    if (!timeOffset.isValid()) {
      return errorResponseBadRequest(`Invalid Date params`)
    }

    if (isNaN(limit) || limit > 100) {
      return errorResponseBadRequest(
        `Limit and offset number be integers with a max limit of 100`
      )
    }
    try {
      const notifications = await models.Notification.findAll({
        where: {
          userId,
          isHidden: false,
          timestamp: {
            [models.Sequelize.Op.lt]: timeOffset.toDate()
          }
        },
        order: [
          ['timestamp', 'DESC'],
          ['entityId', 'ASC']
        ],
        include: [{
          model: models.NotificationAction,
          required: true,
          as: 'actions'
        }],
        limit
      })
      let unreadCount = await models.Notification.findAll({
        where: { userId, isRead: false, isHidden: false },
        include: [{ model: models.NotificationAction, as: 'actions', required: true, attributes: [] }],
        attributes: [[models.Sequelize.fn('COUNT', models.Sequelize.col('Notification.id')), 'total']],
        group: ['Notification.id']
      })
      unreadCount = unreadCount.length

      const readAnnouncementCount = await models.Notification.count({
        where: { userId, isRead: true, type: NotificationType.Announcement }
      })

      const announcements = app.get('announcements')
      const validUserAnnouncements = announcements
        .filter(a => moment(a.datePublished).isAfter(createdDate))
      const announcementsAfterFilter = validUserAnnouncements
        .filter(a => timeOffset.isAfter(moment(a.datePublished)))

      const unreadAnnouncementCount = validUserAnnouncements.length - readAnnouncementCount
      console.log(`unreadAnnouncementCount: ${unreadAnnouncementCount}`)
      const userNotifications = formatNotifications(notifications, announcementsAfterFilter)
      return successResponse({
        message: 'success',
        notifications: userNotifications.slice(0, limit),
        totalUnread: unreadAnnouncementCount + unreadCount
      })
    } catch (err) {
      console.log(err)
      return errorResponseBadRequest({
        message: `[Error] Unable to retrieve notifications for user: ${userId}`
      })
    }
  }))

  /*
   * Sets a user's notifcation as read or hidden
   * postBody: {number?} notificationType The type of the notification to be marked as read (Only used for Announcements)
   * postBody: {number?} notificationID   The id of the notification to be marked as read (Only used for Announcements)
   * postBody: {number} isRead            Identitifies if the notification is to be marked as read
   * postBody: {number} isHidden          Identitifies if the notification is to be marked as hidden
   *
   * TODO: Validate userId
  */
  app.post('/notifications', authMiddleware, handleResponse(async (req, res, next) => {
    let { notificationId, notificationType, isRead, isHidden } = req.body
    const userId = req.user.blockchainUserId

    if (typeof notificationType !== 'string' ||
      !ClientNotificationTypes.has(notificationType) ||
      (typeof isRead !== 'boolean' && typeof isHidden !== 'boolean')) {
      return errorResponseBadRequest('Invalid request body')
    }
    try {
      if (notificationType === NotificationType.Announcement) {
        const announcementMap = app.get('announcementMap')
        const announcement = announcementMap[notificationId]
        if (!announcement) return errorResponseBadRequest('[Error] Invalid notification id')
        await models.Notification.findOrCreate({
          where: {
            type: notificationType,
            userId,
            entityId: announcement.entityId
          },
          defaults: {
            isRead: true,
            isHidden,
            blocknumber: 0,
            timestamp: announcement.datePublished
          }
        })
        return successResponse({ message: 'success' })
      } else {
        await models.Notification.update(
          { isRead: true, isHidden },
          { where: { id: notificationId } }
        )
        return successResponse({ message: 'success' })
      }
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to mark notification as read/hidden`
      })
    }
  }))

  /*
   * Marks all of a user's notifications as read & inserts rows for announcements
   * postBody: {number} isRead        Identitifies if the notification is to be marked as read
   *
   * TODO: Validate userId
  */
  app.post('/notifications/all', authMiddleware, handleResponse(async (req, res, next) => {
    let { isRead } = req.body
    const { createdAt, blockchainUserId: userId } = req.user

    const createdDate = moment(createdAt)
    if (!createdDate.isValid() || typeof userId !== 'number' || userId < 0 || typeof isRead !== 'boolean') {
      return errorResponseBadRequest('Invalid request body')
    }
    try {
      if (typeof isRead === 'boolean') {
        await models.Notification.update(
          { isRead },
          { where: { userId, isRead: !isRead } }
        )

        const announcementMap = app.get('announcementMap')
        const unreadAnnouncementIds = Object.keys(announcementMap).reduce((acc, id) => {
          if (moment(announcementMap[id].datePublished).isAfter(createdDate)) acc[id] = false
          return acc
        }, {})
        const readAnnouncementIds = await models.Notification.findAll({
          where: {
            type: NotificationType.Announcement,
            userId
          },
          attributes: ['entityId']
        })
        for (let announcementId of readAnnouncementIds) {
          delete unreadAnnouncementIds[announcementId.entityId]
        }
        const unreadAnnouncements = Object.keys(unreadAnnouncementIds).map(id => announcementMap[id])
        await models.Notification.bulkCreate(
          unreadAnnouncements.map(announcement => ({
            type: NotificationType.Announcement,
            entityId: announcement.entityId,
            isRead: true,
            isHidden: false,
            userId,
            blocknumber: 0,
            timestamp: announcement.datePublished
          }))
        )
      }
      return successResponse({ message: 'success' })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to mark notification as read/hidden`
      })
    }
  }))

  /*
   * Updates fields for a user's settings (or creates the settings w/ db defaults if not created)
   * postBody: {object} settings      Identitifies if the notification is to be marked as read
   *
   * TODO: Validate userId
  */
  app.post('/notifications/settings', authMiddleware, handleResponse(async (req, res, next) => {
    const { settings } = req.body
    if (typeof settings === 'undefined') {
      return errorResponseBadRequest('Invalid request body')
    }

    try {
      await models.UserNotificationSettings.upsert({
        userId: req.user.blockchainUserId,
        ...settings
      })
      return successResponse({ message: 'success' })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to create/update notification settings for user: ${req.user.blockchainUserId}`
      })
    }
  }))

  /*
   * Fetches the settings for a given userId
  */
  app.get('/notifications/settings', authMiddleware, handleResponse(async (req, res, next) => {
    const userId = req.user.blockchainUserId
    try {
      const [settings] = await models.UserNotificationSettings.findOrCreate({
        where: { userId },
        attributes: [
          'favorites',
          'reposts',
          'milestonesAndAchievements',
          'announcements',
          'followers',
          'browserPushNotifications',
          'emailFrequency'
        ]
      })
      return successResponse({ settings })
    } catch (err) {
      return errorResponseBadRequest({
        message: `[Error] Unable to retrieve notification settings for user: ${userId}`
      })
    }
  }))

  /*
   * Sets or removes a user subscription
   * postBody: {number} userId          The user ID of the subscribed to user
   * postBody: {boolean} isSubscribed   If the user is subscribing or unsubscribing
   *
   * TODO: Validate that the userId is a valid userID
  */
  app.post('/notifications/subscription', authMiddleware, handleResponse(async (req, res, next) => {
    let { userId, isSubscribed } = req.body
    const subscriberId = req.user.blockchainUserId
    console.log({ subscriberId, userId })
    if (typeof userId !== 'number' ||
      typeof subscriberId !== 'number' ||
      userId === subscriberId
    ) {
      return errorResponseBadRequest('Invalid request body')
    }
    if (isSubscribed) {
      await models.Subscription.findOrCreate({
        where: { subscriberId, userId }
      })
    } else {
      await models.Subscription.destroy({
        where: { subscriberId, userId }
      })
    }
    return successResponse({ message: 'success' })
  }))

  /*
   * Returns if a user subscription exists
   * urlQueryParam: {number} userId       The user ID of the subscribed to user
   *
   * TODO: Validate that the subscriberId is comoing from the user w/ their wallet
  */
  app.get('/notifications/subscription', authMiddleware, handleResponse(async (req, res, next) => {
    const userId = parseInt(req.query.userId)
    console.log({ subscriberId: req.user.blockchainUserId, userId })

    if (isNaN(userId)) return errorResponseBadRequest('Invalid request parameters')
    const subscription = await models.Subscription.findOne({
      where: { subscriberId: req.user.blockchainUserId, userId }
    })
    return successResponse({ isSubscribed: !!subscription })
  }))
}
