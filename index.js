const AWS = require('aws-sdk');

exports.handler = async (event) => {

    let requestedMethod = event ? event.httpMethod : null;
    let pathParams = event && event.pathParameters ? event.pathParameters : null;
    let queryParams = event && event.queryStringParameters ? event.queryStringParameters : null;
    console.log("queryParams",queryParams);
    console.log("event",event);
    const s3 = new AWS.S3();
    const compareValues = (key, order = 'asc') => {
        return function innerSort(a, b) {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
         return 0;
        }

     const varA = (typeof a[key] === 'string')
      ? a[key].toUpperCase() : a[key];
     const varB = (typeof b[key] === 'string')
      ? b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
          comparison = 1;
         } else if (varA < varB) {
          comparison = -1;
        }
        return (
         (order === 'desc') ? (comparison * -1) : comparison
         );
        };
    }
      try {
          const params = {
              Bucket: "test-restapi-bucket",
              Key: "store.json"
          };
          var file = await s3.getObject(params).promise();
          var fileContent = file.Body.toString('utf8');
          var storeJsonObject = JSON.parse(fileContent);
          if( pathParams.posts === "posts" && requestedMethod === "GET" && pathParams.id == null){
              //searching and filtering
              if(queryParams != null && queryParams.title && queryParams.author){
              let found = storeJsonObject.posts.some(post => (post.title == queryParams.title && post.author == queryParams.author))
              if(found){
               return {
                  statusCode: 200,
                  body: JSON.stringify(storeJsonObject.posts.filter(post => (post.title == queryParams.title && post.author == queryParams.author)))
               }                   
              }else{
               return {
                  statusCode: 404,
                  body: "no result found, please check your search parameters"
               }                   
              }
              }else if(queryParams != null && queryParams.author){
              let found = storeJsonObject.posts.some(post => post.author == queryParams.author)
              if(found){
               return {
                  statusCode: 200,
                  body: JSON.stringify(storeJsonObject.posts.filter(post => post.author == queryParams.author))
               }                   
              }else{
               return {
                  statusCode: 404,
                  body: "no result found, please check your search parameters"
               }                   
              }                  
              }else if(queryParams != null && queryParams.title){
               let found = storeJsonObject.posts.some(post => post.title == queryParams.title)
              if(found){
               return {
                  statusCode: 200,
                  body: JSON.stringify(storeJsonObject.posts.filter(post => post.title == queryParams.title))
               }                   
              }else{
               return {
                  statusCode: 404,
                  body: "no result found, please check your search parameters"
               }                   
              }
              }else if(queryParams != null && queryParams._sort && queryParams._order){
                 // console.log("sorted",storeJsonObject.posts.sort(compareValues(queryParams._sort, queryParams._order)));
                return {
                  statusCode: 200,
                  body: JSON.stringify(storeJsonObject.posts.sort(compareValues(queryParams._sort, queryParams._order)))
               }                  
              }else{
              return {
                  statusCode: 200,
                  body: JSON.stringify(storeJsonObject.posts)
              }                  
              }
          }else if(pathParams.posts === "posts" && pathParams.id && requestedMethod === "GET"){
              const found = storeJsonObject.posts.some(post => post.id == pathParams.id);
              if(found){
               return {
                  statusCode: 200,
                  body: JSON.stringify(storeJsonObject.posts[parseInt(pathParams.id)])
               }                  
              }else{
               return {
                  statusCode: 404,
                  body: "no entry with provided id exists"
               }                  
              }

          }else if(pathParams.posts === "authors" && requestedMethod === "GET" && pathParams.id == null){
              return {
                  statusCode: 200,
                  body: JSON.stringify(storeJsonObject.authors)
              }
          }else if(pathParams.posts === "authors" && pathParams.id && requestedMethod === "GET"){
              const found = storeJsonObject.authors.some(author => author.id == pathParams.id);
              if(found){
               return {
                  statusCode: 200,
                  body: JSON.stringify(storeJsonObject.authors[parseInt(pathParams.id)])
               }                  
              }else{
               return {
                  statusCode: 404,
                  body: "no entry with provided id exists"
               }                  
              }             
          }else if(pathParams.posts === "posts" && requestedMethod === "POST"){//should be with id also
              let eventBody = JSON.parse(event.body);
              const found = storeJsonObject.posts.some(post => post.id === eventBody.id);
              if (!found){
               let updatedObjectLength = storeJsonObject.posts.push(JSON.parse(event.body));

              console.log("uploading");
              const result = await s3.upload({
                      Bucket: "test-restapi-bucket",
                      Key: "store.json",
                      Body: Buffer.from(JSON.stringify(storeJsonObject))
              }).promise();
              console.log("result of file upload",result);
              return {
                  statusCode: 200,
                  body: "updated store.json"
              }
              }else{
              return {
                  statusCode: 409,
                  body: "entry with same id already exist"
              }
              }
          }else if(pathParams.posts === "authors" && requestedMethod === "POST"){
              let eventBody = JSON.parse(event.body);
              const found = storeJsonObject.authors.some(author => author.id === eventBody.id);
              if (!found){
               let updatedObjectLength = storeJsonObject.authors.push(JSON.parse(event.body));

              console.log("uploading");
              const result = await s3.upload({
                      Bucket: "test-restapi-bucket",
                      Key: "store.json",
                      Body: Buffer.from(JSON.stringify(storeJsonObject))
              }).promise();
              console.log("result of file upload",result);
              return {
                  statusCode: 200,
                  body: "updated store.json"
              }
              }else{
              return {
                  statusCode: 409,
                  body: "entry with same id already exist"
              }
              }
          }else if(pathParams.posts === "posts" && pathParams.id && requestedMethod === "PATCH"){
              let eventBody = JSON.parse(event.body);
              const found = storeJsonObject.posts.some(post => post.id === pathParams.id);
              if (!found){
               let index = storeJsonObject.posts.findIndex(post => post.id === parseInt(pathParams.id));
               if(eventBody.id){
                return {
                  statusCode: 409,
                  body: "cannot update id, it is immutable"
                }                   
               }else if(eventBody.title){
                 storeJsonObject.posts[index].title = eventBody.title;  
               }else if(eventBody.author){
                  storeJsonObject.posts[index].author = eventBody.author; 
               }else if(eventBody.views){
                   storeJsonObject.posts[index].views = eventBody.views;
               }else if(eventBody.reviews){
                   storeJsonObject.posts[index].reviews = eventBody.reviews;
               }
              console.log("uploading");
              const result = await s3.upload({
                      Bucket: "test-restapi-bucket",
                      Key: "store.json",
                      Body: Buffer.from(JSON.stringify(storeJsonObject))
              }).promise();
              console.log("result of file upload",result);
              return {
                  statusCode: 200,
                  body: "updated store.json"
              }
              }else{
              return {
                  statusCode: 404,
                  body: "entry with provided id does not exists"
              }
              }
          }else if(pathParams.posts === "authors" && pathParams.id && requestedMethod === "PATCH"){
              let eventBody = JSON.parse(event.body);
              const found = storeJsonObject.authors.some(author => author.id === pathParams.id);
              if (!found){
               let index = storeJsonObject.authors.findIndex(author => author.id === parseInt(pathParams.id));
               if(eventBody.id){
                return {
                  statusCode: 409,
                  body: "cannot update id, it is immutable"
                }                   
               }else if(eventBody.first_name){
                 storeJsonObject.authors[index].first_name = eventBody.first_name;  
               }else if(eventBody.last_name){
                  storeJsonObject.authors[index].last_name = eventBody.last_name; 
               }else if(eventBody.post){
                   storeJsonObject.authors[index].post = eventBody.post;
               }
              console.log("uploading");
              const result = await s3.upload({
                      Bucket: "test-restapi-bucket",
                      Key: "store.json",
                      Body: Buffer.from(JSON.stringify(storeJsonObject))
              }).promise();
              console.log("result of file upload",result);
              return {
                  statusCode: 200,
                  body: "updated store.json"
              }
              }else{
              return {
                  statusCode: 404,
                  body: "entry with provided id does not exists"
              }
              }
          }else if(pathParams.posts === "posts" && pathParams.id && requestedMethod === "DELETE"){
              const found = storeJsonObject.posts.some(post => post.id == pathParams.id);//apply found changes to all
              if (found && storeJsonObject.posts.length > 0){
               let index = storeJsonObject.posts.findIndex(post => post.id === parseInt(pathParams.id));
               let removedObject = storeJsonObject.posts.splice(index, 1);
               console.log("removed object", removedObject);
               console.log("storeJsonObject after delete", storeJsonObject);
              console.log("uploading");
              const result = await s3.upload({
                      Bucket: "test-restapi-bucket",
                      Key: "store.json",
                      Body: Buffer.from(JSON.stringify(storeJsonObject))
              }).promise();
              console.log("result of file upload",result);
              return {
                  statusCode: 200,
                  body: "updated store.json"
              }
              }else{
              return {
                  statusCode: 404,
                  body: "entry with provided id does not exists"
              }
              }
          }else if(pathParams.posts === "authors" && pathParams.id && requestedMethod === "DELETE"){
              const found = storeJsonObject.authors.some(author => author.id == pathParams.id);//apply found changes to all
              if (found && storeJsonObject.authors.length > 0){
               let index = storeJsonObject.authors.findIndex(author => author.id === parseInt(pathParams.id));
               let removedObject = storeJsonObject.authors.splice(index, 1);
               console.log("removed object", removedObject);
               console.log("storeJsonObject after delete", storeJsonObject);
              console.log("uploading");
              const result = await s3.upload({
                      Bucket: "test-restapi-bucket",
                      Key: "store.json",
                      Body: Buffer.from(JSON.stringify(storeJsonObject))
              }).promise();
              console.log("result of file upload",result);
              return {
                  statusCode: 200,
                  body: "updated store.json"
              }
              }else{
              return {
                  statusCode: 404,
                  body: "entry with provided id does not exists"
              }
              }
          }else if(pathParams.posts === "posts" && pathParams.id && requestedMethod === "PUT"){
              let eventBody = JSON.parse(event.body);
              const found = storeJsonObject.posts.some(post => post.id == eventBody.id);
              if (found){
               let index = storeJsonObject.posts.findIndex(post => post.id === parseInt(pathParams.id));
               storeJsonObject.posts.splice(index, 1);
               storeJsonObject.posts.push(eventBody);
                
              console.log("uploading");
              const result = await s3.upload({
                      Bucket: "test-restapi-bucket",
                      Key: "store.json",
                      Body: Buffer.from(JSON.stringify(storeJsonObject))
              }).promise();
              console.log("result of file upload",result);
              return {
                  statusCode: 200,
                  body: "updated store.json"
              }
              }else{
              return {
                  statusCode: 404,
                  body: "entry with given id does not exist"
              }
              }
          }else if(pathParams.posts === "authors" && pathParams.id && requestedMethod === "PUT"){
              let eventBody = JSON.parse(event.body);
              const found = storeJsonObject.authors.some(author => author.id == eventBody.id);
              if (found){
               let index = storeJsonObject.authors.findIndex(author => author.id === parseInt(pathParams.id));
               storeJsonObject.authors.splice(index, 1);
               storeJsonObject.authors.push(eventBody);
                
              console.log("uploading");
              const result = await s3.upload({
                      Bucket: "test-restapi-bucket",
                      Key: "store.json",
                      Body: Buffer.from(JSON.stringify(storeJsonObject))
              }).promise();
              console.log("result of file upload",result);
              return {
                  statusCode: 200,
                  body: "updated store.json"
              }
              }else{
              return {
                  statusCode: 404,
                  body: "entry with given id does not exist"
              }
              }
          }else{
              return {
                  statusCode: 409,
                  body: "invalid request"
              };
          }

      } catch (error) {
          console.log(error);
          return;
      } 
};
