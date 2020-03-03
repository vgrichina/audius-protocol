const fs = require('fs')
const path = require('path')
const assert = require('assert')

const transcodeFileTo320 = require('./ffmpeg.js')
const ipfsClient = require('ipfs-http-client')

const models = require('./db.js')

const ROOTDIR = '/Users/sid/Documents/Audius/code/audius/audius-protocol/creator-node/download-fix'

const prodDBSFCN1Path = path.join(ROOTDIR, '/prod/cn1-db-sourcefiles.txt')
const prodDBSFCN2Path = path.join(ROOTDIR, '/prod/cn2-db-sourcefiles.txt')
const prodDBSFCN3Path = path.join(ROOTDIR, '/prod/cn3-db-sourcefiles.txt')
const prodDiskSFCN1Path = path.join(ROOTDIR, '/prod/cn1-disk-sourcefiles.txt')
const prodDiskSFCN2Path = path.join(ROOTDIR, '/prod/cn2-disk-sourcefiles.txt')
const prodDiskSFCN3Path = path.join(ROOTDIR, '/prod/cn3-disk-sourcefiles.txt')

const stageDBSFCN1Path = path.join(ROOTDIR, '/staging/cn1-db-sourcefiles-and-uuids.txt')
const stageDBSFCN2Path = path.join(ROOTDIR, '/staging/cn2-db-sourcefiles-and-uuids.txt')
const stageDBSFCN3Path = path.join(ROOTDIR, '/staging/cn3-db-sourcefiles-and-uuids.txt')
const stageDiskSFCN1Path = path.join(ROOTDIR, '/staging/cn1-disk-sourcefiles.txt')
const stageDiskSFCN2Path = path.join(ROOTDIR, '/staging/cn2-disk-sourcefiles.txt')
const stageDiskSFCN3Path = path.join(ROOTDIR, '/staging/cn3-disk-sourcefiles.txt')

/** ipfs connection */

const initIPFS = async () => {
  const ipfs = ipfsClient('localhost', 6001)
  const identity = await ipfs.id()
  console.log(`Current IPFS Peer ID: ${JSON.stringify(identity)}\n`)
  return ipfs
}


const fn = async (env = 'staging') => {
  let dbSFCN1Path, dbSFCN2Path, dbSFCN3Path, diskSFCN1Path, diskSFCN2Path, diskSFCN3Path
  if (env === 'prod') {
    dbSFCN1Path = prodDBSFCN1Path
    dbSFCN2Path = prodDBSFCN2Path
    dbSFCN3Path = prodDBSFCN3Path
    diskSFCN1Path = prodDiskSFCN1Path
    diskSFCN2Path = prodDiskSFCN2Path
    diskSFCN3Path = prodDiskSFCN3Path
  }
  else {
    dbSFCN1Path = stageDBSFCN1Path
    dbSFCN2Path = stageDBSFCN2Path
    dbSFCN3Path = stageDBSFCN3Path
    diskSFCN1Path = stageDiskSFCN1Path
    diskSFCN2Path = stageDiskSFCN2Path
    diskSFCN3Path = stageDiskSFCN3Path
  }

  /** get sourceFiles of all tracks on all CNodes that don't have copy320 file entry on DB */

  let dbSFCN1 = fs.readFileSync(dbSFCN1Path, 'utf8').split('\n')
  console.log(`dbSFCN1 Original length: ${dbSFCN1.length}`)
  const dbSFCN1Map = {}
  dbSFCN1.map(row => {
    let [sourceFile, cnodeUserUUID] = row.split('\t')
    dbSFCN1Map[sourceFile] = cnodeUserUUID
  })
  dbSFCN1 = Object.keys(dbSFCN1Map)
  console.log(`dbSFCN1Map Length: ${dbSFCN1.length}`)

  let dbSFCN2 = fs.readFileSync(dbSFCN2Path, 'utf8').split('\n')
  console.log(`dbSFCN2 Original length: ${dbSFCN2.length}`)
  const dbSFCN2Map = {}
  dbSFCN2.map(row => {
    let [sourceFile, cnodeUserUUID] = row.split('\t')
    dbSFCN2Map[sourceFile] = cnodeUserUUID
  })
  dbSFCN2 = Object.keys(dbSFCN2Map)
  console.log(`dbSFCN2Map Length: ${dbSFCN2.length}`)

  let dbSFCN3 = fs.readFileSync(dbSFCN3Path, 'utf8').split('\n')
  console.log(`dbSFCN3 Original length: ${dbSFCN3.length}`)
  const dbSFCN3Map = {}
  dbSFCN3.map(row => {
    let [sourceFile, cnodeUserUUID] = row.split('\t')
    dbSFCN3Map[sourceFile] = cnodeUserUUID
  })
  dbSFCN3 = Object.keys(dbSFCN3Map)
  console.log(`dbSFCN3Map Length: ${dbSFCN3.length}`)


  /** dedupe all DB sourceFiles into single Set */
  let dbSourceFilesAll = dbSFCN1.concat(dbSFCN2.concat(dbSFCN3))
  assert.equal(dbSFCN1.length + dbSFCN2.length + dbSFCN3.length, dbSourceFilesAll.length, 'fuck')
  dbSourceFilesAll = new Set(dbSourceFilesAll)
  console.log(`Unique track SourceFile DB entries: ${dbSourceFilesAll.size}\n`)
  
  /** get all sourceFile dirs from each disk */
  let diskSFCN1 = fs.readFileSync(diskSFCN1Path, 'utf8').split('\n')
  console.log(`diskSFCN1 length: ${diskSFCN1.length}`)
  let diskSFCN2 = fs.readFileSync(diskSFCN2Path, 'utf8').split('\n')
  console.log(`diskSFCN2 length: ${diskSFCN2.length}`)
  let diskSFCN3 = fs.readFileSync(diskSFCN3Path, 'utf8').split('\n')
  console.log(`diskSFCN3 length: ${diskSFCN3.length}`)

  /** THIS COMMENTED OUT CODE IS NOT NEEDED MOST LIKELY */

  /** dedupe all disk sourceFiles */
  // let diskSourceFilesAll = diskSFCN1.concat(diskSFCN2.concat(diskSFCN3))
  // assert.equal(diskSFCN1.length + diskSFCN2.length + diskSFCN3.length, diskSourceFilesAll.length, 'fuck')
  // diskSourceFilesAll = new Set(diskSourceFilesAll)
  // console.log(`Unique track SourceFile Disk entries: ${diskSourceFilesAll.size}\n`)

  /** Find set intersection of DB & Disk sourceFiles */
  // let sourceFiles = new Set([...dbSourceFilesAll].filter(sf => diskSourceFilesAll.has(sf.split('.')[0])))
  // console.log(`sourceFiles on both DB and Disk: ${sourceFiles.size}\n`)

  /** search all CNodes for every sourceFile for dir with matching name */
  diskSFCN1 = new Set([...diskSFCN1])
  diskSFCN2 = new Set([...diskSFCN2])
  diskSFCN3 = new Set([...diskSFCN3])
  let sfCN1 = new Set([...dbSourceFilesAll].filter(sf => diskSFCN1.has(sf.split('.')[0])))
  console.log(`recoverable sourceFiles (on DB and Disk) sfCN1: ${sfCN1.size}`)
  let sfCN2 = new Set([...dbSourceFilesAll].filter(sf => diskSFCN2.has(sf.split('.')[0])))
  console.log(`recoverable sourceFiles (on DB and Disk) sfCN2: ${sfCN2.size}`)
  let sfCN3 = new Set([...dbSourceFilesAll].filter(sf => diskSFCN3.has(sf.split('.')[0])))
  console.log(`recoverable sourceFiles (on DB and Disk) sfCN3: ${sfCN3.size}`)
  console.log(`total number of recoverable sourceFiles: ${sfCN1.size + sfCN2.size + sfCN3.size}`)

  let allSF = new Set([...sfCN1, ...sfCN2, ...sfCN3])
  console.log(`final set size: ${allSF.size}`)
  Array.from(sfCN2).slice(1, 10).forEach(elem => console.log(`${elem}: ${dbSFCN1Map[elem]}`))

  /** mark sourceFiles that have no matching dir on disk as fucked */

  /** transcode master in every dir to copy320. on ALL CNodes: store at /file_storage/Qm..., save to DB as copy320. */
  // sfCN1 = Array.from(sfCN1)
  // for (let i = 0; i < 10; i++) {
  //   processSourceFile(sfCN1[i])
  // }
}


/**
 * given path to sourceFileDir
 *  - get master file in sourceFileDir
 *  - transcode to 320kbps
 *  - save transcode to /file_storage/Qm..., use same saveFileToIPFSFromFs() functionality
 *  - create copy320 DB entry (consider doing in bulk after all transcodes)
 */
const processSourceFile = async (workDir, sourceFileName, cnodeUserUUID, ipfs, transaction = null) => {
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
  
  // /** save file to db */
  // const queryObj = {
  //   where: {
  //     cnodeUserUUID: cnodeUserUUID,
  //     multihash: multihash,
  //     sourceFile: sourceFileName,
  //     storagePath: dstPath,
  //     type: 'copy320'
  //   },
  // }
  // if (transaction) { queryObj.transaction = transaction }
  // const file = (await models.File.findOrCreate(queryObj))[0].dataValues

  console.log(`Added file ${multihash} for fileUUID ${file.fileUUID} from sourceFile ${sourceFileName}`)
  return dstPath
}


const run = async () => {
  const env = 'staging'
  fn(env)

  // const ipfs = await initIPFS()
  // const workDir = path.join(ROOTDIR, '/staging/cn1-disk-copy')
  // const sourceFileName = '090fa64d-6f45-40ba-a227-cd5f1a7d557c.mp3'
  // const cnodeUserUUID = 'defd3ab0-7762-42be-998a-22eddab8738a'
  // const dstPath = await processSourceFile(workDir, sourceFileName, cnodeUserUUID, ipfs)

  // kube cp 



  console.log('Exiting...')
  // process.exit(0)
}
run()

/**
SF CN 1
DONE 1985bc91-84c7-484e-a478-d7aa86686280.mp3: a8ff10fc-c1fa-4a41-aced-44e535b4787b
DONE 090fa64d-6f45-40ba-a227-cd5f1a7d557c.mp3: defd3ab0-7762-42be-998a-22eddab8738a
632ce11e-1ce4-45a8-ac9b-e37ad84e5e00.mp3: 186706e0-f937-4b88-9141-599dd9c31c3f
f871d982-6ba5-467e-9bb1-9c9188dc83ca.mp3: 8d20c190-acc1-44d9-a646-df7f35546731
36c817a2-11d3-4765-bea7-4348afc1c32b.mp3: c07d276f-6080-4fb0-94b4-c6759d48fd77
6605d59b-0abd-41a7-87d1-08aec5a5df58.mp3: 3c1fbd0c-f36e-42db-8b17-7cadf894e561
acb580dc-372a-4ead-b762-3e7a32cc7e15.mp3: 12df4f0f-8ba5-43fd-8e0c-ce2da34c20b5
d44329d7-cd0b-48d7-bd93-1fcef3cc75e4.mp3: 29f79798-05be-45a3-b223-7b2fae06168c
11db6d80-e41f-4c9f-86fd-b3d574c6138b.mp3: 186706e0-f937-4b88-9141-599dd9c31c3f

SF CN 2
7dd121d1-924d-4a2c-b61c-2f8b10af5b98.mp3: d1f1500f-7a72-4f50-b381-21f964335ced
73ba40ed-a0f7-4fe7-b01d-aa98fd88cdb8.mp3: 11c34897-1946-4dfc-b59c-f646a1fc69fe
822020fb-a210-493b-97d3-b8b625bcd97d.mp3: 5e84a713-5146-40a1-9c4d-b88f68759a3b
27f29252-4468-4f90-bcf3-de2533a6555b.wav: a4182ee5-2db5-401b-812d-00fcdda4e06b
49b24a1c-81bf-4854-9cd0-7f7d13a6061b.mp3: fdab2500-5b3f-4e48-89e4-56cdf273d2d8
4b717188-a3c8-4543-b3d3-b6600e56bbdf.mp3: 2319b92a-7ae4-4d75-9106-071d195a62e6
a5343c34-2293-4e70-871b-b2a53b1bd89f.mp3: ac46b8db-436c-4fdc-a646-f3f5c1f4e2ba
36ce5db1-527e-41ae-9383-3c545b598a6a.mp3: ed7a162e-1602-49de-b6ec-f86b72a3c0d7
70893303-296e-49cf-9084-401c948060f4.mp3: d5071986-1b9b-4782-953c-eef0d29edc56

 */