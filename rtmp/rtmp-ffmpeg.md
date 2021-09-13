## RTMP CONFIG
MAIN
1. nginx-rtmp 모듈 설치 후 제어
2. ffmpeg으로 영상 재 컨버팅 후 전송
```

user www www;
worker_processes 1; ## reason rtmp
pid /run/nginx.pid;
worker_rlimit_nofile 51200;
rtmp_auto_push on;

events {
  use epoll;
  worker_connections 51200;
  multi_accept on;
}

# RTMP
rtmp {
    server {
        listen 1935;
        ping 30s;
        notify_method get;
        chunk_size 4000;
        interleave on;
        publish_time_fix off;
        # exec_static /usr/local/bin/ffmpeg -i rtmp://Your IP/live-test/aaa
        # -vcodec libx264 -vprofile baseline -level 3 -b:v 2000000 -g 10 -s 640x400 -ac 1 -r 15 -f flv rtmp://Your IP/live-test/high
        # -vcodec libx264 -vprofile baseline -level 3 -b:v 800000 -g 10 -s 640x400 -ac 1 -r 15 -f flv rtmp://Your IP/live-test/medium
        # -vcodec libx264 -vprofile baseline -level 3 -b:v 100000 -g 10 -s 640x400 -ac 1 -r 15 -f flv rtmp://Your IP/live-test/low  2>>/var/log/ffmpeg/all.log;
        exec /usr/bin/ffmpeg -i rtmp://127.0.0.1/live/$name
        -vcodec libx264 -vprofile baseline -level 3 -b:v 900k -g 10 -ac 1 -r 24 -f flv rtmp://127.0.0.1/live/$name >>/var/log/ffmpeg/all.log;
        
        application live {
        
            live on;
            record all;
            record_path {{record.path}};
       
            hls on;
            hls_path {{hls.path}}};
            hls_nested on;
            hls_fragment 2s;
            hls_playlist_length 16s;
            
            dash on;
            dash_path {{dash.path}};
            dash_nested on;
            dash_fragment 2s;
            dash_playlist_length 16s;

            # deny play all;
            
        }
    }
}

http {
  include mime.types;
  default_type application/octet-stream;
  server_names_hash_bucket_size 128;
  client_header_buffer_size 32k;
  large_client_header_buffers 4 32k;
  client_max_body_size 3072m;
  client_body_buffer_size 10m;
  sendfile on;
  tcp_nopush on;
  keepalive_timeout 120;
  server_tokens off;
  tcp_nodelay on;

  fastcgi_connect_timeout 300;
  fastcgi_send_timeout 300;
  fastcgi_read_timeout 300;
  fastcgi_buffer_size 64k;
  fastcgi_buffers 4 64k;
  fastcgi_busy_buffers_size 128k;
  fastcgi_temp_file_write_size 128k;
  fastcgi_intercept_errors on;

  #Gzip Compression
  gzip on;
  gzip_buffers 16 8k;
  gzip_comp_level 6;
  gzip_http_version 1.1;
  gzip_min_length 256;
  gzip_proxied any;
  gzip_vary on;
  gzip_types
    text/xml application/xml application/atom+xml application/rss+xml application/xhtml+xml image/svg+xml
    text/javascript application/javascript application/x-javascript
    text/x-json application/json application/x-web-app-manifest+json
    text/css text/plain text/x-component
    font/opentype application/x-font-ttf application/vnd.ms-fontobject
    image/x-icon;
  gzip_disable "MSIE [1-6]\.(?!.*SV1)";

  ##Brotli Compression
  #brotli on;
  #brotli_comp_level 6;
  #brotli_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/javascript image/svg+xml;

  ##If you have a lot of static files to serve through Nginx then caching of the files' metadata (not the actual files' contents) can save some latency.
  #open_file_cache max=1000 inactive=20s;
  #open_file_cache_valid 30s;
  #open_file_cache_min_uses 2;
  #open_file_cache_errors on;
  
  ######################## default ############################
  server {
    listen 80;
    server_name _;
    access_log {{log.path}} combined;
    root /data/wwwroot/default;
    index index.html index.htm index.php;
    #error_page 404 /404.html;
    #error_page 502 /502.html;
    location /nginx_status {
      stub_status on;
      access_log off;
      allow 127.0.0.1;
      deny all;
    }
    location ~ [^/]\.php(/|$) {
      #fastcgi_pass remote_php_ip:9000;
      fastcgi_pass unix:/dev/shm/php-cgi.sock;
      fastcgi_index index.php;
      include fastcgi.conf;
    }
    location ~ .*\.(gif|jpg|jpeg|png|bmp|swf|flv|mp4|ico)$ {
      expires 30d;
      access_log off;
   }
    location ~ .*\.(js|css)?$ {
      expires 7d;
      access_log off;
    }
    location ~ ^/(\.user.ini|\.ht|\.git|\.svn|\.project|LICENSE|README.md) {
      deny all;
    }
  }
########################## vhost #############################
  include vhost/*.conf;
}

```

TEST 
test.sh
```
#! /bin/bash
ffmpeg -re -stream_loop -1 -fflags +genpts -i {{file.path}} -acodec libmp3lame -ar 44100 -b:a 128k \
 -pix_fmt yuv420p   -bufsize 6000k \
 -vb 400k -maxrate 1500k -deinterlace -vcodec libx264           \
 -preset veryfast -g 30 -r 30 -f flv                            \
 rtmp://49.50.162.131/live/vct60cc5b2922706

```
