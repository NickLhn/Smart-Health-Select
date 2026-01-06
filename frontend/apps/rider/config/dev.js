module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {
    'process.env.TARO_APP_API_BASE_URL': JSON.stringify(process.env.TARO_ENV === 'h5' ? '/api' : 'http://127.0.0.1:8080/api')
  },
  mini: {},
  h5: {}
}
