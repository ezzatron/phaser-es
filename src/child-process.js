const {spawn} = require('child_process')

module.exports = {
  commandStdout,
  exec,
  passthru,
}

async function commandStdout (...args) {
  return (await exec(...args)).trim()
}

function exec (options, ...args) {
  return new Promise((resolve, reject) => {
    const [command, ...commandArgs] = args
    const child = spawn(command, commandArgs, options)

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', data => { stdout += data.toString() })
    child.stderr.on('data', data => { stderr += data.toString() })

    child.on('exit', code => {
      if (code === 0) return resolve(stdout)

      const error = new Error(stderr)
      error.code = code

      reject(error)
    })

    child.on('error', reject)
  })
}

function passthru (options, ...args) {
  return new Promise((resolve, reject) => {
    const [command, ...commandArgs] = args
    const child = spawn(command, commandArgs, options)

    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)

    child.on('exit', resolve)
    child.on('error', reject)
  })
}
