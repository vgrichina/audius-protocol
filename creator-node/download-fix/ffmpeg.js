// defaults
const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn
// require install
const ffmpeg = require('ffmpeg-static').path


/** Transcode file into 320kbps mp3 and store in same directory. */
function transcodeFileTo320 (fileDir, fileName) {
  return new Promise((resolve, reject) => {
    const sourcePath = path.resolve(fileDir, fileName)
    const targetPath = path.resolve(fileDir, fileName.split('.')[0] + '-dl.mp3')
    console.log(`Transcoding file ${sourcePath} and saving to ${targetPath}...`)

    // Exit if dl-copy file already exists at target path.
    if (fs.existsSync(targetPath)) {
      console.log(`Downloadable copy already exists at ${targetPath}.`)
      return resolve(targetPath)
    }

    // https://ffmpeg.org/ffmpeg-formats.html#hls-2
    const args = [
      '-i', sourcePath,
      '-ar', '48000', // TODO - move to configs
      '-b:a', '320k',
      // "-vn" flag required to allow track uploading with album art
      // https://stackoverflow.com/questions/20193065/how-to-remove-id3-audio-tag-image-or-metadata-from-mp3-with-ffmpeg
      '-vn',
      targetPath
    ]
    const proc = spawn(ffmpeg, args)

    // capture output
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (data) => (stdout += data.toString()))
    proc.stderr.on('data', (data) => (stderr += data.toString()))

    proc.on('close', (code) => {
      if (code === 0) {
        if (fs.existsSync(targetPath)) {
          return resolve(targetPath)
        } else {
          return reject(new Error('FFMPEG Error'))
        }
      } else {
        console.error('Error when processing file with ffmpeg')
        console.error('Command stdout:', stdout, '\nCommand stderr:', stderr)
        return reject(new Error('FFMPEG Error'))
      }
    })
  })
}

module.exports = transcodeFileTo320