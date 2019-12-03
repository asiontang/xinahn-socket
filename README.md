
# 信安搜索

*Note* 后端文档补齐中，若有问题请提交issue，感谢！

一个开源，高隐私，自架自用的聚合搜索引擎。 [Demo点我](https://xinahn.com)

前后端皆为Javascript撰写，好上手，若有问题或需求请[提交issue](https://github.com/xinahn/xinahn-socket/issues)。

此repo为后端代码，跑完后端之后请接着跑[前端设置](https://github.com/xinahn/xinahn-client)。

### 目前支援的搜索引擎 [查看源码](https://github.com/xinahn/xinahn-socket/)

* [百度](https://baidu.com) | [源码]()
* [百科](https://baike.com) | [源码]()
* [必应](https://cn.bing.com) | [源码]()
* [谷歌](https://www.google.com.hk) | [源码]()
* [百度知道](https://zhidao.baidu.com) | [源码]()
* [知乎](https://zhihu.com) | [源码]()

### 事前准备
确认已安装Nginx以及Node.js

### 安装
```console
$ git clone https://github.com/xinahn/xinahn-socket
$ cd xinahn-socket && npm install
```

### 执行API
1. Antenna.js -> 只需跑一个，接口会跑在port 4100
antenna.js 为一个整合所有并发的请求并且与前端沟通的脚本。
```console
$ node antenna.js
```

2. Minion.js -> 依照需求开启多个，与Antenna.js使用socket沟通。
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