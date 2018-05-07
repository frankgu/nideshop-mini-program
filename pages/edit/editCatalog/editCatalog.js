//index.js
var COS = require('../../../lib/cos-wx-sdk-v5')
var config = require('../../../config/config')
var api = require('../../../config/api.js');

Page({
  data: {
  },
  simpleUpload: function(event) {
    var Bucket = config.cos.bucket;
    var Region = config.cos.region;
    var prefix = 'https://' + Bucket + '.cos.' + Region + '.myqcloud.com/';

    // 计算签名
    var getAuthorization = function (options, callback) {
      wx.request({
        method: 'GET',
        url: api.AuthCOS, // 服务端签名，参考 server 目录下的两个签名例子
        // url: 'http://127.0.0.1:3000/sts-auth',
        data: {
          method: options.method,
          pathname: options.pathname,
        },
        dataType: 'json',
        success: function (result) {
          callback(result.data.data);
        }
      });
    };

    // 上传文件
    var uploadFile = function (filePath) {
      var Key = filePath.substr(filePath.lastIndexOf('/') + 1); // 这里指定上传的文件名
      getAuthorization({method: 'post', pathname: '/'}, function (AuthData) {
        var requestTask = wx.uploadFile({
          url: prefix,
          name: 'file',
          filePath: filePath,
          formData: {
            'key': Key,
            'success_action_status': 200,
            'Signature': AuthData.Authorization,
            'x-cos-security-token': AuthData.XCosSecurityToken,
            'Content-Type': '',
          },
          success: function (res) {
            var Location = prefix + Key;
            wx.showModal({title: '上传成功', content: Location, showCancel: false});
          },
          fail: function (res) {
            wx.showModal({title: '上传失败', content: JSON.stringify(res), showCancel: false});
          }
        });
        requestTask.onProgressUpdate(function (res) {
          console.log('正在进度:', res);
        });
      });
    };

    // 选择文件
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original'], // 可以指定是原图还是压缩图，这里默认用原图
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        uploadFile(res.tempFilePaths[0]);
      }
    })
  }
});

