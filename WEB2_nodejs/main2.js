var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var clr = require('./lib/colors.js');

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    if(pathname ==='/'){
      if(queryData.id === undefined || queryData.id === 'About'){   //초기창, About도 초기창
        fs.readdir('./data', function(err, filelist){
          var title = "About"
          var description = fs.readFileSync('data/About', 'utf-8');
          var list = template.list(filelist);
          var html = template.html(title, list,
            `<h1>${title}</h1>${description}`,
            `<a href="/create">create</a>`
          );
          response.writeHead(200);
          response.end(html);
        });
      }else{    //id 값 있을 떄
        fs.readdir('./data', function(err, filelist){
          fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
            var title = queryData.id;
            var list = template.list(filelist);
            var html = template.html(title, list, `<h1>${title}</h1>${description}`, template.crud(title));
            response.writeHead(200);
            response.end(html); // response.end 출력 완료
          });
        });
      }
    }else if (pathname ==='/create'){
      // 문서 생성, 데이터 전송 post 방식 (get방식은 querystring 이 보임)
      fs.readdir('./data', function(err, filelist){
        var title = "docs_create"
        var list = template.list(filelist);
        var html = template.html(title, list, template.create_html(), '');
        response.writeHead(200);
        response.end(html);
      });
    }else if (pathname==="/create_process"){
      var body = '';
      request.on('data', function(data){  //데이터 조금씩 받을 때마다 합치기
        body = body + data;
      });
      request.on('end', function(){ // 더이상 들어올 데이터 없으면
        var post = qs.parse(body);  // 데이터를 객체화
        var title = post.title;
        var description = post.description;
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.writeHead(302, {Location:`/?id=${qs.escape(title)}`});  // redirection, escape-> 인코딩함수
          response.end();
        });
      });
    } else if(pathname === '/update'){
      fs.readdir('./data', function(err, filelist){
        fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
          var title = queryData.id;
          var list = template.list(filelist);
          // 어떤 파일을 수정할 것인지 알아야해서 대상을 title(수정해야할 것)이 아닌 id로
          var html = template.html(title, list, template.update_html(title, description), '');
          response.writeHead(200);  //readFile은 비동기라서 처리하려면 내부에 있어야함
          response.end(html);
        });
      });
    }else if(pathname === '/update_process'){
      //데이터 가져오기
      var body = '';
      request.on('data', function(data){  //데이터 조금씩 받을 때마다 합치기
        body = body + data;
      });
      request.on('end', function(){ // 더이상 들어올 데이터 없으면
        var post = qs.parse(body);  // 데이터를 객체화
        var id = post.id;
        var title = post.title;
        var description = post.description;
        fs.rename(`data/${id}`, `data/${title}`, function(error){
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location:`/?id=${qs.escape(title)}`});  // redirection, escape-> 인코딩함수
            response.end();
          });
        });
        // console.log(post);
      });
    }else if(pathname === '/delete_process'){
      //데이터 가져오기
      var body = '';
      request.on('data', function(data){  //데이터 조금씩 받을 때마다 합치기
        body = body + data;
      });
      request.on('end', function(){ // 더이상 들어올 데이터 없으면
        var post = qs.parse(body);  // 데이터를 객체화
        var id = post.id;
        fs.unlink(`data/${id}`, function(error){
          response.writeHead(302, {Location:`/`});
          response.end();
        });
        // console.log(post);
      });
    }else{
      response.writeHead(404);
      response.end('Not found');
    }
});
app.listen(3000);


//숫자, 특수 문자 제목
