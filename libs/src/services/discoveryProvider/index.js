const axios = require('axios')
const _ = require('lodash')

const Utils = require('../../utils')

const { DISCOVERY_PROVIDER_TIMESTAMP, UNHEALTHY_BLOCK_DIFF } = require('./constants')

// TODO - webpack workaround. find a way to do this without checkout for .default property
let urlJoin = require('proper-url-join')
if (urlJoin && urlJoin.default) urlJoin = urlJoin.default

let localStorage
if (typeof window === 'undefined' || window === null) {
  const LocalStorage = require('node-localstorage').LocalStorage
  localStorage = new LocalStorage('./local-storage')
} else {
  localStorage = window.localStorage
}

class DiscoveryProvider {
  constructor (autoselect, whitelist, userStateManager, ethContracts, web3Manager) {
    this.autoselect = autoselect
    this.whitelist = whitelist
    this.userStateManager = userStateManager
    this.ethContracts = ethContracts
    this.web3Manager = web3Manager
  }

  async init () {
    let endpoint
    if (this.autoselect) {
      endpoint = await this.autoSelectEndpoint()
    } else {
      if (!this.whitelist || this.whitelist.size === 0) {
        throw new Error('Must pass autoselect true or provide whitelist.')
      }

      const pick = _.sample([...this.whitelist]) // selects random element from list.
      const isValid = await this.ethContracts.validateDiscoveryProvider(pick)
      if (isValid) {
        console.info('Initial discovery provider was valid')
        endpoint = pick
      } else {
        console.info('Initial discovery provider was invalid, searching for a new one')
        endpoint = await this.ethContracts.selectDiscoveryProvider(this.whitelist)
      }
    }
    this.setEndpoint(endpoint)

    if (endpoint && this.web3Manager && this.web3Manager.web3) {
      // Set current user if it exists
      const users = await this.getUsers(1, 0, null, this.web3Manager.getWalletAddress())
      if (users && users[0]) this.userStateManager.setCurrentUser(users[0])
    }
  }

  setEndpoint (endpoint) {
    this.discoveryProviderEndpoint = endpoint
  }

  async autoSelectEndpoint (retries = 3) {
    if (retries > 0) {
      const endpoint = await this.ethContracts.autoselectDiscoveryProvider(this.whitelist)
      if (endpoint) {
        this.setEndpoint(endpoint)
        return endpoint
      }
      return this.autoSelectEndpoint(retries - 1)
    }
    throw new Error('Failed to autoselect discovery provider')
  }

  /**
   * get users with all relevant user data
   * can be filtered by providing an integer array of ids
   * @param {number} limit
   * @param {number} offset
   * @param {Object} idsArray
   * @param {string} walletAddress
   * @param {string} handle
   * @param {Boolean} isCreator null returns all users, true returns creators only, false returns users only
   * @returns {Object} {Array of User metadata Objects}
   * additional metadata fields on user objects:
   *  {Integer} track_count - track count for given user
   *  {Integer} playlist_count - playlist count for given user
   *  {Integer} album_count - album count for given user
   *  {Integer} follower_count - follower count for given user
   *  {Integer} followee_count - followee count for given user
   *  {Integer} repost_count - repost count for given user
   *  {Integer} track_blocknumber - blocknumber of latest track for user
   *  {Boolean} does_current_user_follow - does current user follow given user
   *  {Array} followee_follows - followees of current user that follow given user
   * @example
   * await getUsers()
   * await getUsers(100, 0, [3,2,6]) - Invalid user ids will not be accepted
   */
  async getUsers (limit = 100, offset = 0, idsArray = null, walletAddress = null, handle = null, isCreator = null, minBlockNumber = null) {
    let req = {
      endpoint: 'users',
      queryParams: { limit: limit, offset: offset }
    }
    if (isCreator !== null) {
      req.queryParams.is_creator = isCreator
    }
    if (handle) {
      req.queryParams.handle = handle
    }
    if (walletAddress) {
      req.queryParams.wallet = walletAddress
    }
    if (minBlockNumber) {
      req.queryParams.min_block_number = minBlockNumber
    }
    if (idsArray != null) {
      if (!Array.isArray(idsArray)) {
        throw new Error('Expected integer array of user ids')
      }
      req.queryParams.id = idsArray
    }
    return this._makeRequest(req)
  }

  /**
   * get tracks with all relevant track data
   * can be filtered by providing an integer array of ids
   * @param {number} limit
   * @param {number} offset
   * @param {Object} idsArray
   * @param {number} targetUserId the owner of the tracks being queried
   * @param {string} sort a string of form eg. blocknumber:asc,timestamp:desc describing a sort path
   * @param {number} minBlockNumber The min block number
   * @param {boolean} filterDeleted If set to true, filters the deleted tracks
   * @returns {Object} {Array of track metadata Objects}
   * additional metadata fields on track objects:
   *  {Integer} repost_count - repost count for given track
   *  {Integer} save_count - save count for given track
   *  {Array} followee_reposts - followees of current user that have reposted given track
   *  {Boolean} has_current_user_reposted - has current user reposted given track
   *  {Boolean} has_current_user_saved - has current user saved given track
   * @example
   * await getTracks()
   * await getTracks(100, 0, [3,2,6]) - Invalid track ids will not be accepted
   */
  async getTracks (limit = 100, offset = 0, idsArray = null, targetUserId = null, sort = null, minBlockNumber = null, filterDeleted = null, withUsers = false) {
    let req = { endpoint: 'tracks', queryParams: { limit: limit, offset: offset } }
    if (idsArray) {
      if (!Array.isArray(idsArray)) {
        throw new Error('Expected array of track ids')
      }
      req.queryParams.id = idsArray
    }
    if (minBlockNumber) {
      req.queryParams.min_block_number = minBlockNumber
    }
    if (targetUserId) {
      req.queryParams.user_id = targetUserId
    }
    if (sort) {
      req.queryParams.sort = sort
    }
    if (typeof filterDeleted === 'boolean') {
      req.queryParams.filter_deleted = filterDeleted
    }
    if (withUsers) {
      req.queryParams.with_users = true
    }

    return this._makeRequest(req)
  }

  /**
   * @typedef {Object} getTracksIdentifier
   * @property {string} handle
   * @property {number} id
   * @property {string} url_title
   */

  /**
   * gets all tracks matching identifiers, including unlisted.
   *
   * @param {getTracksIdentifier[]} identifiers
   * @returns {(Array)} track
   */
  async getTracksIncludingUnlisted (identifiers) {
    let req = {
      endpoint: 'tracks_including_unlisted',
      method: 'post',
      data: {
        tracks: identifiers
      }
    }
    return this._makeRequest(req)
  }

  /**
   * Gets tracks trending on Audius.
   * @param {string} genre
   * @param {string} timeFrame one of day, week, month, or year
   * @param {?Array<number>} idsArray track ids
   * @param {?number} limit
   * @param {?number} offset
   * @returns {{listenCounts: Array<{trackId:number, listens:number}>}}
   */
  async getTrendingTracks (genre = null, timeFrame = null, idsArray = null, limit = null, offset = null, withUsers = false) {
    let queryUrl = '/trending/'

    if (timeFrame != null) {
      switch (timeFrame) {
        case 'day':
        case 'week':
        case 'month':
        case 'year':
          break
        default:
          throw new Error('Invalid timeFrame value provided')
      }
      queryUrl += timeFrame
    }

    let queryParams = {}
    if (idsArray !== null) {
      queryParams['id'] = idsArray
    }

    if (limit !== null) {
      queryParams['limit'] = limit
    }

    if (offset !== null) {
      queryParams['offset'] = offset
    }

    if (genre !== null) {
      queryParams['genre'] = genre
    }

    if (withUsers) {
      queryParams['with_users'] = withUsers
    }

    return this._makeRequest({
      endpoint: queryUrl,
      method: 'get',
      queryParams
    })
  }

  /**
   * get full playlist objects, including tracks, for passed in array of playlistId
   * @param {Array} playlistId list of playlist ids
   * @param {number} targetUserId the user whose playlists we're trying to get
   * @returns {Array} array of playlist objects
   * additional metadata fields on playlist objects:
   *  {Integer} repost_count - repost count for given playlist
   *  {Integer} save_count - save count for given playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given playlist
   *  {Array} followee_reposts - followees of current user that have reposted given playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given playlist
   *  {Boolean} has_current_user_saved - has current user saved given playlist
   */
  async getPlaylists (limit = 100, offset = 0, idsArray = null, targetUserId = null) {
    let req = { endpoint: 'playlists', queryParams: { limit: limit, offset: offset } }
    if (idsArray != null) {
      if (!Array.isArray(idsArray)) {
        throw new Error('Expected integer array of user ids')
      }
      req.queryParams.playlist_id = idsArray
    }
    if (targetUserId) {
      req.queryParams.user_id = targetUserId
    }
    return this._makeRequest(req)
  }

  /**
   * Return social feed for current user
   * @param {filter} string - filter by "all", "original", or "repost"
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   * @returns {Object} {Array of track and playlist metadata objects}
   * additional metadata fields on track and playlist objects:
   *  {String} activity_timestamp - timestamp of requested user's repost for given track or playlist,
   *    used for sorting feed
   *  {Integer} repost_count - repost count of given track/playlist
   *  {Integer} save_count - save count of given track/playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given track/playlist
   *  {Array} followee_reposts - followees of current user that have reposted given track/playlist
   */
  async getSocialFeed (filter, limit = 100, offset = 0, withUsers = false) {
    let req = {
      endpoint: 'feed/',
      queryParams: { filter: filter, limit: limit, offset: offset, with_users: withUsers }
    }

    return this._makeRequest(req)
  }

  /**
   * Return repost feed for requested user
   * @param {number} userId - requested user id
   * @param {filter} string - filter by "all", "original", or "repost"
   * @param {number} limit - max # of items to return (for pagination)
   * @param {number} offset - offset into list to return from (for pagination)
   * @returns {Object} {Array of track and playlist metadata objects}
   * additional metadata fields on track and playlist objects:
   *  {String} activity_timestamp - timestamp of requested user's repost for given track or playlist,
   *    used for sorting feed
   *  {Integer} repost_count - repost count of given track/playlist
   *  {Integer} save_count - save count of given track/playlist
   *  {Boolean} has_current_user_reposted - has current user reposted given track/playlist
   *  {Array} followee_reposts - followees of current user that have reposted given track/playlist
   */
  async getUserRepostFeed (userId, limit = 100, offset = 0, withUsers = false) {
    let req = {
      endpoint: 'feed',
      urlParams: '/reposts/' + userId,
      queryParams: { limit: limit, offset: offset, with_users: withUsers }
    }
    return this._makeRequest(req)
  }

  /**
   * get intersection of users that follow followeeUserId and users that are followed by followerUserId
   * @param {number} followeeUserId user that is followed
   * @param {number} followerUserId user that follows
   * @example
   * getFollowIntersectionUsers(100, 0, 1, 1) - IDs must be valid
   */
  async getFollowIntersectionUsers (limit = 100, offset = 0, followeeUserId, followerUserId) {
    let req = {
      endpoint: 'users',
      urlParams: '/intersection/follow/' + followeeUserId + '/' + followerUserId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * get intersection of users that have reposted repostTrackId and users that are followed by followerUserId
   * followee = user that is followed; follower = user that follows
   * @param {number} repostTrackId track that is reposted
   * @param {number} followerUserId user that reposted track
   * @example
   * getTrackRepostIntersectionUsers(100, 0, 1, 1) - IDs must be valid
   */
  async getTrackRepostIntersectionUsers (limit = 100, offset = 0, repostTrackId, followerUserId) {
    let req = {
      endpoint: 'users',
      urlParams: '/intersection/repost/track/' + repostTrackId + '/' + followerUserId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * get intersection of users that have reposted repostPlaylistId and users that are followed by followerUserId
   * followee = user that is followed; follower = user that follows
   * @param {number} repostPlaylistId playlist that is reposted
   * @param {number} followerUserId user that reposted track
   * @example
   * getPlaylistRepostIntersectionUsers(100, 0, 1, 1) - IDs must be valid
   */
  async getPlaylistRepostIntersectionUsers (limit = 100, offset = 0, repostPlaylistId, followerUserId) {
    let req = {
      endpoint: 'users',
      urlParams: '/intersection/repost/playlist/' + repostPlaylistId + '/' + followerUserId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * get users that follow followeeUserId, sorted by follower count descending
   * @param {number} followeeUserId user that is followed
   * @return {Array} array of user objects with standard user metadata
   */
  async getFollowersForUser (limit = 100, offset = 0, followeeUserId) {
    let req = {
      endpoint: 'users',
      urlParams: '/followers/' + followeeUserId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * get users that are followed by followerUserId, sorted by follower count descending
   * @param {number} followerUserId user - i am the one who follows
   * @return {Array} array of user objects with standard user metadata
   */
  async getFolloweesForUser (limit = 100, offset = 0, followerUserId) {
    let req = {
      endpoint: 'users',
      urlParams: '/followees/' + followerUserId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * get users that reposted repostTrackId, sorted by follower count descending
   * @param {number} repostTrackId
   * @return {Array} array of user objects
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getRepostersForTrack(100, 0, 1) - ID must be valid
   */
  async getRepostersForTrack (limit = 100, offset = 0, repostTrackId) {
    let req = {
      endpoint: 'users',
      urlParams: '/reposts/track/' + repostTrackId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * get users that reposted repostPlaylistId, sorted by follower count descending
   * @param {number} repostPlaylistId
   * @return {Array} array of user objects
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getRepostersForPlaylist(100, 0, 1) - ID must be valid
   */
  async getRepostersForPlaylist (limit = 100, offset = 0, repostPlaylistId) {
    let req = {
      endpoint: 'users',
      urlParams: '/reposts/playlist/' + repostPlaylistId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * get users that saved saveTrackId, sorted by follower count descending
   * @param {number} saveTrackId
   * @return {Array} array of user objects
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getSaversForTrack(100, 0, 1) - ID must be valid
   */
  async getSaversForTrack (limit = 100, offset = 0, saveTrackId) {
    let req = {
      endpoint: 'users',
      urlParams: '/saves/track/' + saveTrackId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * get users that saved savePlaylistId, sorted by follower count descending
   * @param {number} savePlaylistId
   * @return {Array} array of user objects
   * additional metadata fields on user objects:
   *  {Integer} follower_count - follower count of given user
   * @example
   * getSaversForPlaylist(100, 0, 1) - ID must be valid
   */
  async getSaversForPlaylist (limit = 100, offset = 0, savePlaylistId) {
    let req = {
      endpoint: 'users',
      urlParams: '/saves/playlist/' + savePlaylistId,
      queryParams: { limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * Perform a full-text search. Returns tracks, users, playlists, albums
   *    with optional user-specific results for each
   *  - user, track, and playlist objects have all same data as returned from standalone endpoints
   * @param {string} text search query
   * @param {string} kind 'tracks', 'users', 'playlists', 'albums', 'all'
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchFull (text, kind, limit = 100, offset = 0) {
    let req = {
      endpoint: 'search/full',
      queryParams: { query: text, kind, limit, offset }
    }
    return this._makeRequest(req)
  }

  /**
   * Perform a lighter-weight full-text search. Returns tracks, users, playlists, albums
   *    with optional user-specific results for each
   *  - user, track, and playlist objects have core data, and track & playlist objects
   *    also return user object
   * @param {string} text search query
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchAutocomplete (text, limit = 100, offset = 0) {
    let req = {
      endpoint: 'search/autocomplete',
      queryParams: { query: text, limit: limit, offset: offset }
    }
    return this._makeRequest(req)
  }

  /**
   * Perform a tags-only search. Returns tracks with required tag and users
   * that have used a tag greater than a specified number of times
   * @param {string} text search query
   * @param {number} user_tag_count min # of times a user must have used a tag to be returned
   * @param {string} kind 'tracks', 'users', 'playlists', 'albums', 'all'
   * @param {number} limit max # of items to return per list (for pagination)
   * @param {number} offset offset into list to return from (for pagination)
   */
  async searchTags (text, user_tag_count = 2, kind = 'all', limit = 100, offset = 0) {
    let req = {
      endpoint: 'search/tags',
      queryParams: { query: text, user_tag_count, kind, limit, offset }
    }
    return this._makeRequest(req)
  }

  /**
   * Return saved playlists for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedPlaylists (limit = 100, offset = 0, withUsers = false) {
    let req = {
      endpoint: 'saves/playlists',
      queryParams: { limit: limit, offset: offset, with_users: withUsers }
    }
    return this._makeRequest(req)
  }

  /**
   * Return saved albums for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedAlbums (limit = 100, offset = 0, withUsers = false) {
    let req = {
      endpoint: 'saves/albums',
      queryParams: { limit: limit, offset: offset, with_users: withUsers }
    }
    return this._makeRequest(req)
  }

  /**
   * Return saved tracks for current user
   * NOTE in returned JSON, SaveType string one of track, playlist, album
   * @param {number} limit - max # of items to return
   * @param {number} offset - offset into list to return from (for pagination)
   */
  async getSavedTracks (limit = 100, offset = 0, withUsers = false) {
    let req = {
      endpoint: 'saves/tracks',
      queryParams: { limit: limit, offset: offset, with_users: withUsers }
    }
    return this._makeRequest(req)
  }

  /* ------- INTERNAL FUNCTIONS ------- */

  // TODO(DM) - standardize this to axios like audius service and creator node
  // requestObj consists of multiple properties
  // endpoint - base route
  // urlParams - string of url params to be appended after base route
  // queryParams - object of query params to be appended to url
  async _makeRequest (requestObj, retries = 4) {
    if (!this.discoveryProviderEndpoint) {
      await this.autoSelectEndpoint()
    }

    let requestUrl

    if (urlJoin && urlJoin.default) {
      requestUrl = urlJoin.default(this.discoveryProviderEndpoint, requestObj.endpoint, requestObj.urlParams, { query: requestObj.queryParams })
    } else requestUrl = urlJoin(this.discoveryProviderEndpoint, requestObj.endpoint, requestObj.urlParams, { query: requestObj.queryParams })

    const headers = {}
    const currentUserId = this.userStateManager.getCurrentUserId()
    if (currentUserId) {
      headers['X-User-ID'] = currentUserId
    }

    let axiosRequest = {
      url: requestUrl,
      headers: headers,
      method: (requestObj.method || 'get'),
      timeout: 10000
    }

    if (requestObj.method === 'post' && requestObj.data) {
      axiosRequest = {
        ...axiosRequest,
        data: requestObj.data
      }
    }

    try {
      const response = await axios(axiosRequest)
      const parsedResponse = Utils.parseDataFromResponse(response)

      if (
        !this.ethContracts.isInRegressedMode() &&
        'latest_indexed_block' in parsedResponse &&
        'latest_chain_block' in parsedResponse
      ) {
        const {
          latest_indexed_block: indexedBlock,
          latest_chain_block: chainBlock
        } = parsedResponse

        if (
          !chainBlock ||
          !indexedBlock ||
          (chainBlock - indexedBlock) > UNHEALTHY_BLOCK_DIFF
        ) {
          // Clear any cached discprov
          localStorage.removeItem(DISCOVERY_PROVIDER_TIMESTAMP)
          // Select a new one
          console.info(`${this.discoveryProviderEndpoint} is too far behind, reselecting discovery provider`)
          const endpoint = await this.autoSelectEndpoint()
          this.setEndpoint(endpoint)
          throw new Error(`Selected endpoint was too far behind. Indexed: ${indexedBlock} Chain: ${chainBlock}`)
        }
      }

      return parsedResponse.data
    } catch (e) {
      console.error(e)
      if (retries > 0) {
        return this._makeRequest(requestObj, retries - 1)
      }
    }
  }
}

module.exports = DiscoveryProvider
