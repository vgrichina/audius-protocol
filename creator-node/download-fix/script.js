const fs = require('fs')
const path = require('path')
const assert = require('assert')

const ipfsClient = require('ipfs-http-client')

const transcodeFileTo320 = require('./ffmpeg.js')


const initIPFS = async () => {
  const ipfsHost = process.env.ipfsHost
  const ipfsPort = process.env.ipfsPort
  if (!ipfsHost || !ipfsPort) {
    console.log('Must set ipfsHost and ipfsPort envvars.')
    process.exit(1)
  }
  const ipfs = ipfsClient(ipfsHost, ipfsPort)
  const identity = await ipfs.id()
  console.log(`Current IPFS Peer ID: ${JSON.stringify(identity)}`)
  return ipfs
}

/**
 * given path to sourceFileDir
 *  - get master file in sourceFileDir
 *  - transcode to 320kbps
 *  - save transcode to /file_storage/Qm..., use same saveFileToIPFSFromFs() functionality
 *  - create copy320 DB entry (consider doing in bulk after all transcodes)
 */
const processSourceFile = async (workDir, sourceFileName, ipfs, transaction = null) => {
  const fileDir = path.resolve(workDir, sourceFileName.split('.')[0])
  if (!fs.existsSync(fileDir)) {
    console.error(`Path does not exist: ${fileDir}`)
    return false
  }
  
  console.log(`transcoding ${fileDir}`)
  const dlCopyFilePath = await transcodeFileTo320(fileDir, sourceFileName)
  console.log(`Transcoded file ${sourceFileName} to ${dlCopyFilePath}.`)

  const multihash = (await ipfs.addFromFs(dlCopyFilePath, { pin: false, onlyHash: true }))[0].hash
  console.log(`Computed file IPFS CID: ${multihash}`)
  
  const dstPath = path.join(workDir, multihash)
  
  fs.renameSync(dlCopyFilePath, dstPath)
  console.log(`Moved file from ${dlCopyFilePath} to ${dstPath}`)

  return dstPath
}

const writeToDb = async (cnodeUserUUID, multihash, sourceFileName, dstPath, transaction = null) => {
  /** save file to db */
  const queryObj = {
    where: {
      cnodeUserUUID: cnodeUserUUID,
      multihash: multihash,
      sourceFile: sourceFileName,
      storagePath: dstPath,
      type: 'copy320'
    },
  }
  if (transaction) { queryObj.transaction = transaction }
  const file = (await models.File.findOrCreate(queryObj))[0].dataValues
}


const run = async () => {
  const ipfs = await initIPFS()

  const workDir = '/tmp'
  const sourceFileName = '7dd121d1-924d-4a2c-b61c-2f8b10af5b98.mp3'
  
  const dstPath = await processSourceFile(workDir, sourceFileName, ipfs)
}
run()