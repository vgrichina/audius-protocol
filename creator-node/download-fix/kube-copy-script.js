const util = require('util')
const exec = util.promisify(require('child_process').exec)
// const { exec } = require('child_process')

const run = async () => {
  // given path, cp file from one container to other
  const namespace = 'stage'
  const srcPod = 'creator-2-backend-774977f5c5-6sm8w'
  const srcPodPath = '/tmp/test.txt'
  const localPath = '/Users/sid/Documents/Audius/code/audius/audius-protocol/creator-node/download-fix/test.txt'
  const dstPod = 'creator-3-backend-6f48df689d-s9tfc'
  const dstPodPath = '/tmp/test.txt'
  
  let cmd, obj

  cmd = `kubectl cp ${namespace}/${srcPod}:${srcPodPath} ${localPath}`
  obj = await exec(cmd)
  console.log('stdout: ', obj['stdout'])
  console.log('stderr: ', obj['stderr'])

  cmd = `kubectl cp ${localPath} ${namespace}/${dstPod}:${dstPodPath}`
  obj = await exec(cmd)
  console.log('stdout: ', obj['stdout'])
  console.log('stderr: ', obj['stderr'])

}
run()