
# 信安搜索

**Note** 后端文档补齐中，若有问题请提交issue，感谢！

一个开源，高隐私，自架自用的聚合搜索引擎。 [Demo点我](https://xinahn.com)

前后端皆为Javascript撰写，好上手，若有问题或需求请[提交issue](https://github.com/xinahn/xinahn-socket/issues)。

此repo为后端代码，跑完后端之后请接着跑[前端设置](https://github.com/xinahn/xinahn-client)。

### 目前支援的搜索引擎

| 搜索引擎        | 源码 ```./utils/*.js```           | 状态  |
| ------------- |:-------------:| -----:|
| [百度](https://baidu.com) | [se_baiduParser.js](https://github.com/xinahn/xinahn-socket/blob/master/utils/se_baiduParser.js) | ✅ |
| [百科](https://baike.com) | [se_baikeParser.js](https://github.com/xinahn/xinahn-socket/blob/master/utils/se_baikeParser.js) |  ✅ |
| [必应](https://cn.bing.com) | [se_bingParser.js](https://github.com/xinahn/xinahn-socket/blob/master/utils/se_bingParser.js) | ✅ |
| [谷歌](https://www.google.com.hk) | [se_googleParser.js](https://github.com/xinahn/xinahn-socket/blob/master/utils/se_googleParser.js) | ✅ |
| [百度知道](https://zhidao.baidu.com) | [se_zhidaoParser.js](https://github.com/xinahn/xinahn-socket/blob/master/utils/se_zhidaoParser.js) | ✅ |
| [知乎](https://zhihu.com) | [se_zhihuParser.js](https://github.com/xinahn/xinahn-socket/blob/master/utils/se_zhihuParser.js) | ✅ |

### 事前准备
确认已安装Nginx以及Node.js

### 安装
```console
$ git clone https://github.com/xinahn/xinahn-socket
$ cd xinahn-socket && npm install
```

### 执行API
1. Antenna.js -> 只需跑一个，接口会跑在 port 4100
antenna.js 为一个整合所有并发的请求并且与前端沟通的脚本。
```console
$ node antenna.js
```

2. Minion.js -> 依照需求开启多个，与 Antenna.js 进行 socket 沟通。
```console
$ node minion.js
```

### Nginx 设置
将以下代码黏贴于 ```/etc/nginx/sites-available/default.conf``` 之中。
```
server {
	...
	location ^~ /api/ {
		proxy_pass http://localhost:4100
 	}
	...
}
```

### 重新载入 Nginx 设定即可
```console
$ service nginx reload
```

# License
[MIT](https://github.com/xinahn/xinahn-client/blob/master/LICENSE)