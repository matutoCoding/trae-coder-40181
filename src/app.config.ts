export default defineAppConfig({
  pages: [
    'pages/calls/index',
    'pages/tasks/index',
    'pages/profile/index',
    'pages/call-detail/index',
    'pages/rectification/index',
    'pages/report/index',
    'pages/ledger/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2B5AFF',
    navigationBarTitleText: '质检协同板',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#2B5AFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/calls/index',
        text: '通话列表'
      },
      {
        pagePath: 'pages/tasks/index',
        text: '任务中心'
      },
      {
        pagePath: 'pages/profile/index',
        text: '个人中心'
      }
    ]
  }
})
