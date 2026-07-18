stdout | tests/payouts.test.ts
[EMAIL STUB] To: payout-seller@example.com | Subject: Verify Your Email - Reverse Marketplace
[EMAIL STUB] Body: Hi Payout, please verify your email: http://localhost:8080/verify-email?token=b8b0de661dcc2058f4be8eb7b740bb086d917bcd60e49f81319521ac2c5221e9

{"level":30,"time":1776398295509,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295510,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","res":{"statusCode":201},"responseTime":422.0836249887943,"msg":"request completed"}
{"level":30,"time":1776398295513,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295517,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295523,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-j","res":{"statusCode":200},"responseTime":403.60912500321865,"msg":"request completed"}
{"level":30,"time":1776398295523,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-k","req":{"method":"POST","url":"/api/v1/auth/refresh","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295539,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-k","res":{"statusCode":200},"responseTime":15.22758300602436,"msg":"request completed"}
 ✓ tests/auth.test.ts > POST /api/v1/auth/refresh > should return new tokens with valid refresh token 423ms
{"level":30,"time":1776398295564,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-l","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/ai-assist.test.ts
[dotenv@17.3.1] injecting env (7) from .env -- tip: 🛡️ auth for agents: https://vestauth.com

stdout | tests/posts.test.ts > PUT /api/v1/posts/:postId > should reject update from non-owner
[EMAIL STUB] To: posttest2@example.com | Subject: Verify Your Email - Reverse Marketplace
[EMAIL STUB] Body: Hi Other, please verify your email: http://localhost:8080/verify-email?token=d4612536324f67ab8fd76d9ba4f59e59f6b79efcdf8ee23e4bba66f1be0111a1

{"level":30,"time":1776398295754,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-j","res":{"statusCode":201},"responseTime":374.27429100871086,"msg":"request completed"}
{"level":30,"time":1776398295755,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-k","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/search.test.ts
[EMAIL STUB] To: searchtest@example.com | Subject: Verify Your Email - Reverse Marketplace
[EMAIL STUB] Body: Hi Search, please verify your email: http://localhost:8080/verify-email?token=db786d87d92295090fdb1ad874f8c58daeab1174c9f8a15c19d416380a4d5970

{"level":30,"time":1776398295789,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":201},"responseTime":342.47679099440575,"msg":"request completed"}
{"level":30,"time":1776398295803,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-2","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295810,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-e","res":{"statusCode":400},"responseTime":682.1485000103712,"msg":"request completed"}
 ✓ tests/users.test.ts > POST /api/v1/users/me/change-password > should reject same password 683ms
{"level":30,"time":1776398295810,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-f","req":{"method":"PATCH","url":"/api/v1/users/me/account-type","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295840,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","res":{"statusCode":200},"responseTime":330.6626249998808,"msg":"request completed"}
{"level":30,"time":1776398295843,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","req":{"method":"POST","url":"/api/v1/saved-searches","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295846,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","res":{"statusCode":200},"responseTime":329.0897080004215,"msg":"request completed"}
{"level":30,"time":1776398295847,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","req":{"method":"PATCH","url":"/api/v1/users/me/account-type","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295850,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","res":{"statusCode":200},"responseTime":337.39120899140835,"msg":"request completed"}
{"level":30,"time":1776398295851,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-f","res":{"statusCode":200},"responseTime":40.810416996479034,"msg":"request completed"}
{"level":30,"time":1776398295851,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","req":{"method":"POST","url":"/api/v1/sellers","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295853,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-g","req":{"method":"PATCH","url":"/api/v1/users/me/account-type","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295862,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","res":{"statusCode":201},"responseTime":18.54695799946785,"msg":"request completed"}
{"level":30,"time":1776398295863,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","req":{"method":"POST","url":"/api/v1/saved-searches","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295863,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","res":{"statusCode":401},"responseTime":0.4702499955892563,"msg":"request completed"}
{"level":30,"time":1776398295864,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","req":{"method":"POST","url":"/api/v1/saved-searches","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295867,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","res":{"statusCode":400},"responseTime":3.7877089977264404,"msg":"request completed"}
{"level":30,"time":1776398295869,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","req":{"method":"GET","url":"/api/v1/saved-searches","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295872,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-g","res":{"statusCode":200},"responseTime":18.318000003695488,"msg":"request completed"}
{"level":30,"time":1776398295872,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-h","req":{"method":"PUT","url":"/api/v1/users/me/fcm-token","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295878,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-h","res":{"statusCode":200},"responseTime":5.358165994286537,"msg":"request completed"}
{"level":30,"time":1776398295879,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-i","req":{"method":"GET","url":"/api/v1/users/9333e9be-45dd-4cba-aa8c-b8fc1dc87915","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295884,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-i","res":{"statusCode":200},"responseTime":4.132290989160538,"msg":"request completed"}
{"level":30,"time":1776398295884,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-j","req":{"method":"GET","url":"/api/v1/users/00000000-0000-0000-0000-000000000000","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295889,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-j","res":{"statusCode":404},"responseTime":5.14283399283886,"msg":"request completed"}
{"level":30,"time":1776398295890,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","res":{"statusCode":200},"responseTime":20.991500005126,"msg":"request completed"}
{"level":30,"time":1776398295890,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-k","req":{"method":"GET","url":"/api/v1/users/not-a-uuid","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295891,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-k","res":{"statusCode":400},"responseTime":0.6509170085191727,"msg":"request completed"}
{"level":30,"time":1776398295891,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-l","req":{"method":"DELETE","url":"/api/v1/users/me","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295893,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-9","req":{"method":"GET","url":"/api/v1/saved-searches","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295897,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","res":{"statusCode":200},"responseTime":49.48370799422264,"msg":"request completed"}
{"level":30,"time":1776398295897,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","req":{"method":"GET","url":"/api/v1/sellers/me","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295898,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","res":{"statusCode":201},"responseTime":47.23479199409485,"msg":"request completed"}
{"level":30,"time":1776398295899,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-l","res":{"statusCode":200},"responseTime":334.38004200160503,"msg":"request completed"}
{"level":30,"time":1776398295899,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-m","req":{"method":"POST","url":"/api/v1/auth/refresh","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295901,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-9","res":{"statusCode":200},"responseTime":8.056916996836662,"msg":"request completed"}
{"level":30,"time":1776398295901,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","res":{"statusCode":200},"responseTime":4.262749999761581,"msg":"request completed"}
{"level":30,"time":1776398295902,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","req":{"method":"PATCH","url":"/api/v1/sellers/me","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295902,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","req":{"method":"PUT","url":"/api/v1/saved-searches/bcc30a45-a383-4b5d-bcc3-006adb122bca","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295907,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-m","res":{"statusCode":200},"responseTime":8.107207998633385,"msg":"request completed"}
{"level":30,"time":1776398295907,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-n","req":{"method":"POST","url":"/api/v1/auth/refresh","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295910,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","req":{"method":"GET","url":"/api/v1/categories/services","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295911,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-n","res":{"statusCode":401},"responseTime":3.3367919921875,"msg":"request completed"}
 ✓ tests/auth.test.ts > POST /api/v1/auth/refresh > should reject reused (rotated) refresh token 372ms
 ✓ tests/users.test.ts > PATCH /api/v1/users/me/account-type > should switch to both and auto-create seller profile 43ms
 ✓ tests/users.test.ts > PATCH /api/v1/users/me/account-type > should switch to buyer 19ms
 ✓ tests/users.test.ts > PUT /api/v1/users/me/fcm-token > should update FCM token 6ms
 ✓ tests/users.test.ts > GET /api/v1/users/:userId > should return public profile for valid user 6ms
 ✓ tests/users.test.ts > GET /api/v1/users/:userId > should return 404 for non-existent user 6ms
 ✓ tests/users.test.ts > GET /api/v1/users/:userId > should return 400 for invalid UUID 1ms
{"level":30,"time":1776398295917,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-o","req":{"method":"POST","url":"/api/v1/auth/refresh","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295918,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-o","res":{"statusCode":401},"responseTime":0.8744580000638962,"msg":"request completed"}
{"level":30,"time":1776398295920,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","res":{"statusCode":200},"responseTime":18.509833991527557,"msg":"request completed"}
{"level":30,"time":1776398295921,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","res":{"statusCode":200},"responseTime":10.112416997551918,"msg":"request completed"}
{"level":30,"time":1776398295921,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","res":{"statusCode":200},"responseTime":18.759374991059303,"msg":"request completed"}
{"level":30,"time":1776398295921,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","req":{"method":"GET","url":"/api/v1/categories/plumbing","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295921,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-b","req":{"method":"PUT","url":"/api/v1/saved-searches/bcc30a45-a383-4b5d-bcc3-006adb122bca","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295925,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","res":{"statusCode":200},"responseTime":4.072125002741814,"msg":"request completed"}
{"level":30,"time":1776398295925,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","req":{"method":"GET","url":"/api/v1/categories/services","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295925,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-b","res":{"statusCode":403},"responseTime":4.183957993984222,"msg":"request completed"}
{"level":30,"time":1776398295926,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-c","req":{"method":"PUT","url":"/api/v1/saved-searches/00000000-0000-0000-0000-000000000000","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295926,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","req":{"method":"POST","url":"/api/v1/posts","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295936,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","res":{"statusCode":200},"responseTime":10.672791004180908,"msg":"request completed"}
{"level":30,"time":1776398295936,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-c","res":{"statusCode":404},"responseTime":10.03787499666214,"msg":"request completed"}
{"level":30,"time":1776398295936,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-d","req":{"method":"DELETE","url":"/api/v1/saved-searches/bcc30a45-a383-4b5d-bcc3-006adb122bca","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295937,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-9","req":{"method":"GET","url":"/api/v1/categories/plumbing","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295940,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-p","req":{"method":"POST","url":"/api/v1/auth/logout","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295941,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-p","res":{"statusCode":401},"responseTime":1.3196250051259995,"msg":"request completed"}
 ✓ tests/saved-searches.test.ts > Saved Searches Module > POST /api/v1/saved-searches > should create a saved search 21ms
 ✓ tests/saved-searches.test.ts > Saved Searches Module > POST /api/v1/saved-searches > should require authentication 1ms
 ✓ tests/saved-searches.test.ts > Saved Searches Module > POST /api/v1/saved-searches > should validate search type enum 4ms
 ✓ tests/saved-searches.test.ts > Saved Searches Module > GET /api/v1/saved-searches > should list saved searches 23ms
 ✓ tests/saved-searches.test.ts > Saved Searches Module > GET /api/v1/saved-searches > should not return other users' saved searches 10ms
 ✓ tests/saved-searches.test.ts > Saved Searches Module > PUT /api/v1/saved-searches/:searchId > should update a saved search 19ms
 ✓ tests/saved-searches.test.ts > Saved Searches Module > PUT /api/v1/saved-searches/:searchId > should reject update by non-owner 5ms
 ✓ tests/saved-searches.test.ts > Saved Searches Module > PUT /api/v1/saved-searches/:searchId > should return 404 for non-existent search 11ms
{"level":30,"time":1776398295943,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-d","res":{"statusCode":403},"responseTime":6.229417011141777,"msg":"request completed"}
{"level":30,"time":1776398295944,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-9","res":{"statusCode":200},"responseTime":5.858916997909546,"msg":"request completed"}
{"level":30,"time":1776398295944,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","req":{"method":"POST","url":"/api/v1/posts","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295944,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-e","req":{"method":"DELETE","url":"/api/v1/saved-searches/bcc30a45-a383-4b5d-bcc3-006adb122bca","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295948,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-q","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398295955,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-e","res":{"statusCode":204},"responseTime":11.639917001128197,"msg":"request completed"}
{"level":30,"time":1776398295956,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-f","req":{"method":"GET","url":"/api/v1/saved-searches","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/payments.test.ts
prisma:error 
Invalid `prisma.post.create()` invocation in
/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36

  72 // Resolve marketplace context: explicit input > request header > user default
  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';
  74 
→ 75 const post = await prisma.post.create(
The column `is_seed` does not exist in the current database.

{"level":50,"time":1776398295963,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.post.create()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36\n\n  72 // Resolve marketplace context: explicit input > request header > user default\n  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';\n  74 \n→ 75 const post = await prisma.post.create(\nThe column `is_seed` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.post.create()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36\n\n  72 // Resolve marketplace context: explicit input > request header > user default\n  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';\n  74 \n→ 75 const post = await prisma.post.create(\nThe column `is_seed` does not exist in the current database.\n    at zr.handleRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:8172)\n    at zr.handleAndLogRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7467)\n    at zr.request (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7174)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at a (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:75:5816)\n    at PostsService.createPost (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:18)\n    at Object.<anonymous> (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.routes.ts:31:20)","code":"P2022","meta":{"modelName":"Post","driverAdapterError":{"name":"DriverAdapterError","cause":{"originalCode":"42703","originalMessage":"column \"is_seed\" of relation \"posts\" does not exist","kind":"ColumnNotFound","column":"is_seed"}}},"clientVersion":"7.4.0","name":"PrismaClientKnownRequestError"},"requestId":"de05174b-8bbc-40ed-a582-cea0a3da56e8","method":"POST","url":"/api/v1/posts","msg":"Unhandled error"}
{"level":30,"time":1776398295964,"pid":95644,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","res":{"statusCode":500},"responseTime":38.785209000110626,"msg":"request completed"}
{"level":30,"time":1776398295968,"pid":95645,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-f","res":{"statusCode":200},"responseTime":11.663457989692688,"msg":"request completed"}
stdout | tests/payouts.test.ts
prisma:error 
Invalid `prisma.post.create()` invocation in
/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36

  72 // Resolve marketplace context: explicit input > request header > user default
  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';
  74 
→ 75 const post = await prisma.post.create(
The column `is_seed` does not exist in the current database.

{"level":50,"time":1776398295975,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.post.create()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36\n\n  72 // Resolve marketplace context: explicit input > request header > user default\n  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';\n  74 \n→ 75 const post = await prisma.post.create(\nThe column `is_seed` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.post.create()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36\n\n  72 // Resolve marketplace context: explicit input > request header > user default\n  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';\n  74 \n→ 75 const post = await prisma.post.create(\nThe column `is_seed` does not exist in the current database.\n    at zr.handleRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:8172)\n    at zr.handleAndLogRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7467)\n    at zr.request (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7174)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at a (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:75:5816)\n    at PostsService.createPost (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:18)\n    at Object.<anonymous> (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.routes.ts:31:20)","code":"P2022","meta":{"modelName":"Post","driverAdapterError":{"name":"DriverAdapterError","cause":{"originalCode":"42703","originalMessage":"column \"is_seed\" of relation \"posts\" does not exist","kind":"ColumnNotFound","column":"is_seed"}}},"clientVersion":"7.4.0","name":"PrismaClientKnownRequestError"},"requestId":"7d8f3312-05ca-4bb1-be6f-d7d2005358c5","method":"POST","url":"/api/v1/posts","msg":"Unhandled error"}
{"level":30,"time":1776398295975,"pid":95628,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","res":{"statusCode":500},"responseTime":31.235584005713463,"msg":"request completed"}
 ✓ tests/saved-searches.test.ts > Saved Searches Module > DELETE /api/v1/saved-searches/:searchId > should reject delete by non-owner 7ms
 ✓ tests/saved-searches.test.ts > Saved Searches Module > DELETE /api/v1/saved-searches/:searchId > should soft delete a saved search 25ms
 ↓ tests/payments.test.ts > POST /api/v1/payments/create-intent > should create a payment intent for a transaction
 ↓ tests/payments.test.ts > POST /api/v1/payments/create-intent > should reject duplicate payment intent
 ↓ tests/payments.test.ts > POST /api/v1/payments/create-intent > should reject if not the buyer
 ↓ tests/payments.test.ts > POST /api/v1/payments/create-intent > should reject non-existent transaction
 ↓ tests/payments.test.ts > POST /api/v1/payments/create-intent > should require authentication
 ↓ tests/payments.test.ts > POST /api/v1/payments/refund > should refund a transaction
 ↓ tests/payments.test.ts > POST /api/v1/payments/refund > should reject refund on already-refunded transaction
 ↓ tests/payments.test.ts > POST /api/v1/payments/refund > should reject if not the buyer
 ↓ tests/payments.test.ts > POST /api/v1/payments/seller/onboard > should return onboarding URL for existing Stripe account
 ↓ tests/payments.test.ts > POST /api/v1/payments/seller/onboard > should create new account for seller without Stripe
 ↓ tests/payments.test.ts > POST /api/v1/payments/seller/onboard > should reject non-seller
 ↓ tests/payments.test.ts > GET /api/v1/payments/seller/status > should return Stripe status for onboarded seller
 ↓ tests/payments.test.ts > GET /api/v1/payments/seller/status > should return not-onboarded for seller without Stripe
 ↓ tests/payments.test.ts > GET /api/v1/payments/seller/status > should reject non-seller
 ↓ tests/payments.test.ts > POST /api/v1/payments/webhook > should reject missing stripe-signature header
 ↓ tests/payments.test.ts > POST /api/v1/payments/webhook > should reject invalid signature
 ↓ tests/payments.test.ts > POST /api/v1/payments/webhook > should handle payment_intent.succeeded event
 ↓ tests/payments.test.ts > POST /api/v1/payments/webhook > should handle account.updated event
 ✓ tests/auth.test.ts > POST /api/v1/auth/refresh > should reject invalid refresh token 7ms
 ✓ tests/auth.test.ts > POST /api/v1/auth/logout > should require authentication 23ms
 ↓ tests/payouts.test.ts > Payouts Module > GET /api/v1/payouts > should list seller payouts
 ↓ tests/payouts.test.ts > Payouts Module > GET /api/v1/payouts > should filter by status
 ↓ tests/payouts.test.ts > Payouts Module > GET /api/v1/payouts > should reject non-seller users
 ↓ tests/payouts.test.ts > Payouts Module > GET /api/v1/payouts > should require authentication
 ↓ tests/payouts.test.ts > Payouts Module > GET /api/v1/payouts/summary > should return earnings summary
 ↓ tests/payouts.test.ts > Payouts Module > GET /api/v1/payouts/:payoutId > should return payout detail
 ↓ tests/payouts.test.ts > Payouts Module > GET /api/v1/payouts/:payoutId > should return 404 for non-existent payout
{"level":30,"time":1776398296083,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-k","res":{"statusCode":200},"responseTime":328.7748339921236,"msg":"request completed"}
{"level":30,"time":1776398296084,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-l","req":{"method":"PUT","url":"/api/v1/posts/undefined","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296085,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-l","res":{"statusCode":400},"responseTime":1.2471249997615814,"msg":"request completed"}
{"level":30,"time":1776398296086,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-m","req":{"method":"GET","url":"/api/v1/posts/undefined","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296086,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-m","res":{"statusCode":400},"responseTime":0.15570800006389618,"msg":"request completed"}
{"level":30,"time":1776398296086,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-n","req":{"method":"POST","url":"/api/v1/posts/undefined/extend","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296087,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-n","res":{"statusCode":400},"responseTime":1.01316699385643,"msg":"request completed"}
{"level":30,"time":1776398296088,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-o","req":{"method":"POST","url":"/api/v1/posts/undefined/mark-filled","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296088,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-o","res":{"statusCode":400},"responseTime":0.43425001204013824,"msg":"request completed"}
{"level":30,"time":1776398296089,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-p","req":{"method":"POST","url":"/api/v1/posts/undefined/mark-filled","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296090,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-p","res":{"statusCode":400},"responseTime":0.556207999587059,"msg":"request completed"}
{"level":30,"time":1776398296090,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-q","req":{"method":"POST","url":"/api/v1/posts/undefined/repost","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296091,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-q","res":{"statusCode":400},"responseTime":0.8048340082168579,"msg":"request completed"}
{"level":30,"time":1776398296092,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-r","req":{"method":"DELETE","url":"/api/v1/posts/undefined","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296093,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-r","res":{"statusCode":400},"responseTime":0.45158299803733826,"msg":"request completed"}
{"level":30,"time":1776398296094,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-s","req":{"method":"GET","url":"/api/v1/posts/feed","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/posts.test.ts > GET /api/v1/posts/feed > should return active posts
prisma:error 
Invalid `prisma.post.findMany()` invocation in
/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:447:19

  444 })();
  445 
  446 const [posts, total] = await Promise.all([
→ 447   prisma.post.findMany(
The column `(not available)` does not exist in the current database.

{"level":50,"time":1776398296100,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-s","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.post.findMany()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:447:19\n\n  444 })();\n  445 \n  446 const [posts, total] = await Promise.all([\n→ 447   prisma.post.findMany(\nThe column `(not available)` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.post.findMany()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:447:19\n\n  444 })();\n  445 \n  446 const [posts, total] = await Promise.all([\n→ 447   prisma.post.findMany(\nThe column `(not available)` does not exist in the current database.\n    at zr.handleRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:8172)\n    at zr.handleAndLogRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7467)\n    at zr.request (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7174)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at a (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:75:5816)\n    at async Promise.all (index 0)\n    at PostsService.getFeed (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:446:28)\n    at Object.<anonymous> (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.routes.ts:56:22)","code":"P2022","meta":{"modelName":"Post","driverAdapterError":{"name":"DriverAdapterError","cause":{"originalCode":"42703","originalMessage":"column posts.public_after does not exist","kind":"ColumnNotFound"}}},"clientVersion":"7.4.0","name":"PrismaClientKnownRequestError"},"requestId":"7296af43-db5e-4fd5-95aa-0c15c1745ebf","method":"GET","url":"/api/v1/posts/feed","msg":"Unhandled error"}
{"level":30,"time":1776398296100,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-s","res":{"statusCode":500},"responseTime":6.198333993554115,"msg":"request completed"}
{"level":30,"time":1776398296100,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-t","req":{"method":"GET","url":"/api/v1/posts/feed?categoryId=c27fd65e-10bf-4051-ac66-11b5bd95621b","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296112,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-2","res":{"statusCode":200},"responseTime":308.7895829975605,"msg":"request completed"}
stdout | tests/posts.test.ts > GET /api/v1/posts/feed > should filter by category
prisma:error 
Invalid `prisma.post.findMany()` invocation in
/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:447:19

  444 })();
  445 
  446 const [posts, total] = await Promise.all([
→ 447   prisma.post.findMany(
The column `(not available)` does not exist in the current database.

{"level":30,"time":1776398296112,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","req":{"method":"GET","url":"/api/v1/categories/services","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":50,"time":1776398296116,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-t","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.post.findMany()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:447:19\n\n  444 })();\n  445 \n  446 const [posts, total] = await Promise.all([\n→ 447   prisma.post.findMany(\nThe column `(not available)` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.post.findMany()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:447:19\n\n  444 })();\n  445 \n  446 const [posts, total] = await Promise.all([\n→ 447   prisma.post.findMany(\nThe column `(not available)` does not exist in the current database.\n    at zr.handleRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:8172)\n    at zr.handleAndLogRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7467)\n    at zr.request (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7174)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at a (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:75:5816)\n    at async Promise.all (index 0)\n    at PostsService.getFeed (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:446:28)\n    at Object.<anonymous> (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.routes.ts:56:22)","code":"P2022","meta":{"modelName":"Post","driverAdapterError":{"name":"DriverAdapterError","cause":{"originalCode":"42703","originalMessage":"column posts.public_after does not exist","kind":"ColumnNotFound"}}},"clientVersion":"7.4.0","name":"PrismaClientKnownRequestError"},"requestId":"5e6b3690-e1f7-435d-b792-558f5b23e420","method":"GET","url":"/api/v1/posts/feed?categoryId=c27fd65e-10bf-4051-ac66-11b5bd95621b","msg":"Unhandled error"}
{"level":30,"time":1776398296117,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-t","res":{"statusCode":500},"responseTime":16.570583000779152,"msg":"request completed"}
{"level":30,"time":1776398296117,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-u","req":{"method":"GET","url":"/api/v1/posts/search?q=plumbing+sink","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296121,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","res":{"statusCode":200},"responseTime":8.390208005905151,"msg":"request completed"}
{"level":30,"time":1776398296121,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","req":{"method":"GET","url":"/api/v1/categories/plumbing","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296124,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","res":{"statusCode":200},"responseTime":3.2100000083446503,"msg":"request completed"}
{"level":30,"time":1776398296124,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","req":{"method":"GET","url":"/api/v1/categories/products","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296127,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","res":{"statusCode":200},"responseTime":2.2610830068588257,"msg":"request completed"}
{"level":30,"time":1776398296127,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","req":{"method":"GET","url":"/api/v1/categories/electronics","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296129,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","res":{"statusCode":200},"responseTime":1.5965420007705688,"msg":"request completed"}
{"level":30,"time":1776398296129,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","req":{"method":"POST","url":"/api/v1/posts","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296149,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-u","res":{"statusCode":200},"responseTime":31.27037499845028,"msg":"request completed"}
{"level":30,"time":1776398296149,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-v","req":{"method":"GET","url":"/api/v1/posts/search","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296150,"pid":95643,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-v","res":{"statusCode":400},"responseTime":0.42216700315475464,"msg":"request completed"}
stdout | tests/geocoding.test.ts
[dotenv@17.3.1] injecting env (7) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }

stdout | tests/search.test.ts
prisma:error 
Invalid `prisma.post.create()` invocation in
/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36

  72 // Resolve marketplace context: explicit input > request header > user default
  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';
  74 
→ 75 const post = await prisma.post.create(
The column `is_seed` does not exist in the current database.

{"level":50,"time":1776398296166,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.post.create()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36\n\n  72 // Resolve marketplace context: explicit input > request header > user default\n  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';\n  74 \n→ 75 const post = await prisma.post.create(\nThe column `is_seed` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.post.create()` invocation in\n/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:36\n\n  72 // Resolve marketplace context: explicit input > request header > user default\n  73 const marketplaceContext = input.marketplaceContext ?? requestContext ?? 'b2c';\n  74 \n→ 75 const post = await prisma.post.create(\nThe column `is_seed` does not exist in the current database.\n    at zr.handleRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:8172)\n    at zr.handleAndLogRequestError (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7467)\n    at zr.request (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:65:7174)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at a (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:75:5816)\n    at PostsService.createPost (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.service.ts:75:18)\n    at Object.<anonymous> (/Users/faisalidris/ReverseMarketplace/backend/src/modules/posts/posts.routes.ts:31:20)","code":"P2022","meta":{"modelName":"Post","driverAdapterError":{"name":"DriverAdapterError","cause":{"originalCode":"42703","originalMessage":"column \"is_seed\" of relation \"posts\" does not exist","kind":"ColumnNotFound","column":"is_seed"}}},"clientVersion":"7.4.0","name":"PrismaClientKnownRequestError"},"requestId":"c0af4b97-77d3-445c-9636-43339f7f8f8b","method":"POST","url":"/api/v1/posts","msg":"Unhandled error"}
{"level":30,"time":1776398296167,"pid":95664,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","res":{"statusCode":500},"responseTime":37.522624999284744,"msg":"request completed"}
 ✓ tests/geocoding.test.ts > Geocoding Service > should return null when GOOGLE_MAPS_API_KEY is not set 2ms
 ✓ tests/geocoding.test.ts > Geocoding Service > should return null when no address parts provided 0ms
 ✓ tests/geocoding.test.ts > Geocoding Service > should return coordinates for a valid address 0ms
 ✓ tests/geocoding.test.ts > Geocoding Service > should return null when geocoding API returns no results 0ms
 ✓ tests/geocoding.test.ts > Geocoding Service > should return null when fetch throws 0ms
 × tests/posts.test.ts > PUT /api/v1/posts/:postId > should reject update from non-owner 714ms
   → expected 400 to be 403 // Object.is equality
 × tests/posts.test.ts > POST /api/v1/posts/:postId/extend > should extend post by 3 days 0ms
   → Cannot read properties of undefined (reading 'expiresAt')
 × tests/posts.test.ts > POST /api/v1/posts/:postId/extend > should reject double extension 2ms
   → expected 400 to be 409 // Object.is equality
 × tests/posts.test.ts > POST /api/v1/posts/:postId/mark-filled > should mark post as filled 1ms
   → expected 400 to be 200 // Object.is equality
 × tests/posts.test.ts > POST /api/v1/posts/:postId/mark-filled > should reject marking non-active post as filled 1ms
   → expected 400 to be 409 // Object.is equality
 × tests/posts.test.ts > POST /api/v1/posts/:postId/repost > should create a new post from existing one 1ms
   → expected 400 to be 201 // Object.is equality
 × tests/posts.test.ts > DELETE /api/v1/posts/:postId > should soft-delete a post 2ms
   → expected 400 to be 204 // Object.is equality
 × tests/posts.test.ts > GET /api/v1/posts/feed > should return active posts 7ms
   → expected 500 to be 200 // Object.is equality
 × tests/posts.test.ts > GET /api/v1/posts/feed > should filter by category 17ms
   → expected 500 to be 200 // Object.is equality
 ✓ tests/posts.test.ts > GET /api/v1/posts/search > should search posts by text 32ms
 ✓ tests/posts.test.ts > GET /api/v1/posts/search > should require search query 1ms
 ↓ tests/search.test.ts > GET /api/v1/search/posts > should find posts matching search query
 ↓ tests/search.test.ts > GET /api/v1/search/posts > should return 400 when q parameter is missing
 ↓ tests/search.test.ts > GET /api/v1/search/posts > should return empty array for non-matching query
 ↓ tests/search.test.ts > GET /api/v1/search/posts > should filter by categoryId
 ↓ tests/search.test.ts > GET /api/v1/search/posts > should filter by budget range
 ↓ tests/search.test.ts > GET /api/v1/search/posts > should return pagination metadata
stdout | tests/categories.test.ts
[dotenv@17.3.1] injecting env (7) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild

{"level":30,"time":1776398296204,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-l","res":{"statusCode":403},"responseTime":313.10395799577236,"msg":"request completed"}
 ✓ tests/users.test.ts > DELETE /api/v1/users/me > should reject with wrong password 313ms
{"level":30,"time":1776398296205,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-m","req":{"method":"DELETE","url":"/api/v1/users/me","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296254,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-q","res":{"statusCode":200},"responseTime":305.9080420136452,"msg":"request completed"}
{"level":30,"time":1776398296254,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-r","req":{"method":"POST","url":"/api/v1/auth/logout","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296256,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-r","res":{"statusCode":200},"responseTime":1.8014580011367798,"msg":"request completed"}
{"level":30,"time":1776398296256,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-s","req":{"method":"POST","url":"/api/v1/auth/logout","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
 ✓ tests/auth.test.ts > POST /api/v1/auth/logout > should logout successfully and blacklist access token 315ms
{"level":30,"time":1776398296257,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-s","res":{"statusCode":401},"responseTime":0.5870829969644547,"msg":"request completed"}
{"level":30,"time":1776398296261,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-t","req":{"method":"GET","url":"/api/v1/auth/verify-email?token=test-verify-token-123","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296262,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-t","res":{"statusCode":200},"responseTime":1.2613749951124191,"msg":"request completed"}
{"level":30,"time":1776398296264,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-u","req":{"method":"GET","url":"/api/v1/auth/verify-email?token=invalid-token","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296265,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-u","res":{"statusCode":400},"responseTime":0.6434170007705688,"msg":"request completed"}
{"level":30,"time":1776398296267,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-v","req":{"method":"GET","url":"/api/v1/auth/verify-email?token=single-use-token-456","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296269,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-v","res":{"statusCode":200},"responseTime":1.8401250094175339,"msg":"request completed"}
{"level":30,"time":1776398296269,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-w","req":{"method":"GET","url":"/api/v1/auth/verify-email?token=single-use-token-456","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296270,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-w","res":{"statusCode":400},"responseTime":0.34825000166893005,"msg":"request completed"}
{"level":30,"time":1776398296273,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-x","req":{"method":"POST","url":"/api/v1/auth/resend-verification","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/auth.test.ts > POST /api/v1/auth/resend-verification > should return success for existing unverified user
[EMAIL STUB] To: authtest@example.com | Subject: Verify Your Email - Reverse Marketplace
[EMAIL STUB] Body: Hi Auth, please verify your email: http://localhost:8080/verify-email?token=db3799cf08f6f44ea7a542016bef35183de7157b606d60795135c7c19824a72d

{"level":30,"time":1776398296275,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-x","res":{"statusCode":200},"responseTime":1.404666006565094,"msg":"request completed"}
{"level":30,"time":1776398296277,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-y","req":{"method":"POST","url":"/api/v1/auth/resend-verification","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296278,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-y","res":{"statusCode":200},"responseTime":1.1657500118017197,"msg":"request completed"}
{"level":30,"time":1776398296282,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-z","req":{"method":"POST","url":"/api/v1/auth/resend-verification","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/auth.test.ts > POST /api/v1/auth/resend-verification > should enforce cooldown on repeated requests
[EMAIL STUB] To: authtest@example.com | Subject: Verify Your Email - Reverse Marketplace
[EMAIL STUB] Body: Hi Auth, please verify your email: http://localhost:8080/verify-email?token=6bfeaab9b6a5b6d8f57286ab628a28e743a04639176cb67f41baf8509fd53d78

{"level":30,"time":1776398296285,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-z","res":{"statusCode":200},"responseTime":2.542583003640175,"msg":"request completed"}
{"level":30,"time":1776398296285,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-10","req":{"method":"POST","url":"/api/v1/auth/resend-verification","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296286,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-10","res":{"statusCode":400},"responseTime":1.4499170035123825,"msg":"request completed"}
{"level":30,"time":1776398296289,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-11","req":{"method":"POST","url":"/api/v1/auth/forgot-password","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/auth.test.ts > POST /api/v1/auth/forgot-password > should return generic success for existing email
[EMAIL STUB] To: authtest@example.com | Subject: Reset Your Password - Reverse Marketplace
[EMAIL STUB] Body: Hi Auth, reset your password: http://localhost:8080/reset-password?token=ba7469a879582cd53abe3cf1b5a9362c8bfbfb91fc13d2ece5d46b0d288d647d

{"level":30,"time":1776398296292,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-11","res":{"statusCode":200},"responseTime":2.5842499881982803,"msg":"request completed"}
{"level":30,"time":1776398296296,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-12","req":{"method":"POST","url":"/api/v1/auth/forgot-password","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296298,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-12","res":{"statusCode":200},"responseTime":1.9719589948654175,"msg":"request completed"}
{"level":30,"time":1776398296299,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-13","req":{"method":"POST","url":"/api/v1/auth/reset-password","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296301,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-13","res":{"statusCode":400},"responseTime":1.1641670018434525,"msg":"request completed"}
{"level":30,"time":1776398296305,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-14","req":{"method":"POST","url":"/api/v1/auth/reset-password","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
 ✓ tests/auth.test.ts > GET /api/v1/auth/verify-email > should verify email with valid token 6ms
 ✓ tests/auth.test.ts > GET /api/v1/auth/verify-email > should reject invalid token 2ms
 ✓ tests/auth.test.ts > GET /api/v1/auth/verify-email > should reject reuse of same token (single-use) 5ms
 ✓ tests/auth.test.ts > POST /api/v1/auth/resend-verification > should return success for existing unverified user 5ms
 ✓ tests/auth.test.ts > POST /api/v1/auth/resend-verification > should return success for non-existent email (no enumeration) 3ms
 ✓ tests/auth.test.ts > POST /api/v1/auth/resend-verification > should enforce cooldown on repeated requests 8ms
 ✓ tests/auth.test.ts > POST /api/v1/auth/forgot-password > should return generic success for existing email 5ms
 ✓ tests/auth.test.ts > POST /api/v1/auth/forgot-password > should return generic success for non-existent email 5ms
 ✓ tests/auth.test.ts > POST /api/v1/auth/reset-password > should reject invalid token 3ms
{"level":30,"time":1776398296398,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1","req":{"method":"POST","url":"/api/v1/auth/register","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296501,"pid":95521,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-m","res":{"statusCode":200},"responseTime":296.3599169999361,"msg":"request completed"}
 ✓ tests/users.test.ts > DELETE /api/v1/users/me > should soft delete account with correct password 300ms
{"level":30,"time":1776398296507,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1","req":{"method":"POST","url":"/api/v1/auth/register","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296593,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-14","res":{"statusCode":400},"responseTime":287.86962500214577,"msg":"request completed"}
 ✓ tests/auth.test.ts > POST /api/v1/auth/reset-password > should reject same password as current 292ms
{"level":30,"time":1776398296596,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-15","req":{"method":"POST","url":"/api/v1/auth/reset-password","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/notifications.test.ts
[EMAIL STUB] To: notiftest-user@example.com | Subject: Verify Your Email - Reverse Marketplace
[EMAIL STUB] Body: Hi Notif, please verify your email: http://localhost:8080/verify-email?token=b0a728ca6f42e51f69dd554304286499658eab139407ae80ff54647fad5ad19b

{"level":30,"time":1776398296706,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":201},"responseTime":306.9877920001745,"msg":"request completed"}
{"level":30,"time":1776398296710,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-2","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stdout | tests/ai-assist.test.ts
[EMAIL STUB] To: aitest@example.com | Subject: Verify Your Email - Reverse Marketplace
[EMAIL STUB] Body: Hi AI, please verify your email: http://localhost:8080/verify-email?token=2357c3a0256ca746056362514ef5c97ee11c5660c70386e6a4d135643ffe1be3

{"level":30,"time":1776398296795,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":201},"responseTime":287.51591700315475,"msg":"request completed"}
{"level":30,"time":1776398296799,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-2","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296803,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1","req":{"method":"GET","url":"/api/v1/categories","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296878,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1","res":{"statusCode":200},"responseTime":74.56829100847244,"msg":"request completed"}
{"level":30,"time":1776398296879,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-2","req":{"method":"GET","url":"/api/v1/categories?mvpOnly=true","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296882,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-2","res":{"statusCode":200},"responseTime":2.0851670056581497,"msg":"request completed"}
{"level":30,"time":1776398296882,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","req":{"method":"GET","url":"/api/v1/categories/services","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296888,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","res":{"statusCode":200},"responseTime":5.987790986895561,"msg":"request completed"}
{"level":30,"time":1776398296888,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","req":{"method":"GET","url":"/api/v1/categories?parentId=c27fd65e-10bf-4051-ac66-11b5bd95621b","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296890,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","res":{"statusCode":200},"responseTime":1.8158330023288727,"msg":"request completed"}
{"level":30,"time":1776398296891,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","req":{"method":"GET","url":"/api/v1/categories/tree","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296896,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","res":{"statusCode":200},"responseTime":5.197291001677513,"msg":"request completed"}
{"level":30,"time":1776398296897,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","req":{"method":"GET","url":"/api/v1/categories/products","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296899,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","res":{"statusCode":200},"responseTime":2.003374993801117,"msg":"request completed"}
 ✓ tests/categories.test.ts > GET /api/v1/categories > should list top-level categories 81ms
 ✓ tests/categories.test.ts > GET /api/v1/categories > should filter by MVP-enabled only 3ms
 ✓ tests/categories.test.ts > GET /api/v1/categories > should list subcategories when parentId is provided 9ms
 ✓ tests/categories.test.ts > GET /api/v1/categories/tree > should return full category tree with children 6ms
 ✓ tests/categories.test.ts > GET /api/v1/categories/:slug > should return category with children 2ms
{"level":30,"time":1776398296899,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","req":{"method":"GET","url":"/api/v1/categories/nonexistent-category","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296900,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","res":{"statusCode":404},"responseTime":0.9985840022563934,"msg":"request completed"}
{"level":30,"time":1776398296900,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","req":{"method":"GET","url":"/api/v1/categories/plumbing","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398296902,"pid":95712,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","res":{"statusCode":200},"responseTime":1.088792011141777,"msg":"request completed"}
 ✓ tests/categories.test.ts > GET /api/v1/categories/:slug > should return 404 for non-existent slug 1ms
 ✓ tests/categories.test.ts > GET /api/v1/categories/:slug > should return a leaf category with empty children 2ms
{"level":30,"time":1776398296989,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-2","res":{"statusCode":200},"responseTime":278.98925000429153,"msg":"request completed"}
{"level":30,"time":1776398296996,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","req":{"method":"GET","url":"/api/v1/notifications","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297006,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","res":{"statusCode":200},"responseTime":9.806875005364418,"msg":"request completed"}
{"level":30,"time":1776398297007,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","req":{"method":"GET","url":"/api/v1/notifications?unreadOnly=true","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297010,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","res":{"statusCode":200},"responseTime":2.910083994269371,"msg":"request completed"}
{"level":30,"time":1776398297011,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","req":{"method":"GET","url":"/api/v1/notifications?type=new_offer","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297014,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","res":{"statusCode":200},"responseTime":3.4157919883728027,"msg":"request completed"}
{"level":30,"time":1776398297015,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","req":{"method":"GET","url":"/api/v1/notifications?page=1&limit=2","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297018,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","res":{"statusCode":200},"responseTime":3.5029999911785126,"msg":"request completed"}
{"level":30,"time":1776398297019,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","req":{"method":"GET","url":"/api/v1/notifications","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297020,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","res":{"statusCode":401},"responseTime":0.7056249976158142,"msg":"request completed"}
{"level":30,"time":1776398297020,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","req":{"method":"PUT","url":"/api/v1/notifications/7851b1a3-d08a-4c96-afae-ef0708ceb91e/read","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297024,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","res":{"statusCode":200},"responseTime":3.2146250009536743,"msg":"request completed"}
{"level":30,"time":1776398297025,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-9","req":{"method":"PUT","url":"/api/v1/notifications/a0000000-0000-4000-a000-000000000099/read","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297027,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-9","res":{"statusCode":404},"responseTime":1.5452080070972443,"msg":"request completed"}
{"level":30,"time":1776398297028,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","req":{"method":"PUT","url":"/api/v1/notifications/read-all","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297031,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","res":{"statusCode":200},"responseTime":2.7962909936904907,"msg":"request completed"}
{"level":30,"time":1776398297032,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-b","req":{"method":"DELETE","url":"/api/v1/notifications/cfe40eff-8ce1-42e2-aa24-e9bdd3f1da1b","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297034,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-b","res":{"statusCode":204},"responseTime":1.6067500114440918,"msg":"request completed"}
{"level":30,"time":1776398297034,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-c","req":{"method":"DELETE","url":"/api/v1/notifications/cfe40eff-8ce1-42e2-aa24-e9bdd3f1da1b","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297035,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-c","res":{"statusCode":404},"responseTime":0.8747919946908951,"msg":"request completed"}
{"level":30,"time":1776398297035,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-d","req":{"method":"GET","url":"/api/v1/notifications","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297036,"pid":95689,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-d","res":{"statusCode":200},"responseTime":0.7822089940309525,"msg":"request completed"}
 ✓ tests/notifications.test.ts > GET /api/v1/notifications > should list notifications 11ms
 ✓ tests/notifications.test.ts > GET /api/v1/notifications > should filter unread only 4ms
 ✓ tests/notifications.test.ts > GET /api/v1/notifications > should filter by type 4ms
 ✓ tests/notifications.test.ts > GET /api/v1/notifications > should respect pagination 4ms
 ✓ tests/notifications.test.ts > GET /api/v1/notifications > should reject without auth 1ms
 ✓ tests/notifications.test.ts > PUT /api/v1/notifications/:notificationId/read > should mark notification as read 4ms
 ✓ tests/notifications.test.ts > PUT /api/v1/notifications/:notificationId/read > should return 404 for non-existent notification 2ms
 ✓ tests/notifications.test.ts > PUT /api/v1/notifications/read-all > should mark all notifications as read 5ms
 ✓ tests/notifications.test.ts > DELETE /api/v1/notifications/:notificationId > should soft delete notification 2ms
 ✓ tests/notifications.test.ts > DELETE /api/v1/notifications/:notificationId > should return 404 for already deleted notification 1ms
 ✓ tests/notifications.test.ts > DELETE /api/v1/notifications/:notificationId > should exclude deleted from list 1ms
{"level":30,"time":1776398297080,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-2","res":{"statusCode":200},"responseTime":280.9897090047598,"msg":"request completed"}
{"level":30,"time":1776398297081,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","req":{"method":"GET","url":"/api/v1/categories/services","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297088,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-3","res":{"statusCode":200},"responseTime":7.663333997130394,"msg":"request completed"}
{"level":30,"time":1776398297089,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","req":{"method":"GET","url":"/api/v1/categories/plumbing","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297090,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-4","res":{"statusCode":200},"responseTime":1.6700419932603836,"msg":"request completed"}
{"level":30,"time":1776398297091,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","req":{"method":"POST","url":"/api/v1/posts/ai/parse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297099,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-5","res":{"statusCode":200},"responseTime":6.9853329956531525,"msg":"request completed"}
{"level":30,"time":1776398297099,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","req":{"method":"POST","url":"/api/v1/posts/ai/parse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297103,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-6","res":{"statusCode":200},"responseTime":3.189416006207466,"msg":"request completed"}
{"level":30,"time":1776398297103,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","req":{"method":"POST","url":"/api/v1/posts/ai/parse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297103,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-7","res":{"statusCode":401},"responseTime":0.3210829943418503,"msg":"request completed"}
{"level":30,"time":1776398297103,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","req":{"method":"POST","url":"/api/v1/posts/ai/parse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297105,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-8","res":{"statusCode":400},"responseTime":1.0044590085744858,"msg":"request completed"}
{"level":30,"time":1776398297105,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-9","req":{"method":"POST","url":"/api/v1/posts/ai/parse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297109,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-9","res":{"statusCode":200},"responseTime":3.448416993021965,"msg":"request completed"}
{"level":30,"time":1776398297110,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","req":{"method":"POST","url":"/api/v1/posts/ai/suggest-images","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297111,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-a","res":{"statusCode":200},"responseTime":1.054625004529953,"msg":"request completed"}
{"level":30,"time":1776398297111,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-b","req":{"method":"POST","url":"/api/v1/posts/ai/suggest-images","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297111,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-b","res":{"statusCode":401},"responseTime":0.13304199278354645,"msg":"request completed"}
{"level":30,"time":1776398297112,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-c","req":{"method":"POST","url":"/api/v1/posts/ai/generate-job-profile","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297113,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-c","res":{"statusCode":200},"responseTime":0.9499579966068268,"msg":"request completed"}
{"level":30,"time":1776398297113,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-d","req":{"method":"POST","url":"/api/v1/posts/ai/generate-job-profile","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297114,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-d","res":{"statusCode":200},"responseTime":0.6017500013113022,"msg":"request completed"}
{"level":30,"time":1776398297114,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-e","req":{"method":"POST","url":"/api/v1/posts/ai/generate-job-profile","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297114,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-e","res":{"statusCode":400},"responseTime":0.46529199182987213,"msg":"request completed"}
{"level":30,"time":1776398297115,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-f","req":{"method":"POST","url":"/api/v1/posts/ai/parse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297115,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-f","res":{"statusCode":429},"responseTime":0.5518330037593842,"msg":"request completed"}
{"level":30,"time":1776398297115,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-g","req":{"method":"POST","url":"/api/v1/posts/ai/parse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stderr | tests/ai-assist.test.ts > AI-Assisted Post Creation > Error Handling > should handle AI returning invalid JSON
[AI PARSE ERROR] Failed to parse AI response: This is not valid JSON at all

{"level":30,"time":1776398297117,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-g","res":{"statusCode":500},"responseTime":1.8779999911785126,"msg":"request completed"}
{"level":30,"time":1776398297118,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-h","req":{"method":"POST","url":"/api/v1/posts/ai/parse","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
stderr | tests/ai-assist.test.ts > AI-Assisted Post Creation > Error Handling > should handle AI service errors gracefully
[AI SERVICE ERROR] Error: API quota exceeded
    at /Users/faisalidris/ReverseMarketplace/backend/tests/ai-assist.test.ts:418:49
    at file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@vitest/runner/dist/index.js:145:11
    at file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@vitest/runner/dist/index.js:915:26
    at file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@vitest/runner/dist/index.js:1243:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@vitest/runner/dist/index.js:1209:10)
    at file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@vitest/runner/dist/index.js:1653:37
    at Traces.$ (file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/vitest/dist/chunks/traces.CCmnQaNT.js:142:27)
    at trace (file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/vitest/dist/chunks/test.B8ej_ZHS.js:239:21)
    at runTest (file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@vitest/runner/dist/index.js:1653:12)

{"level":30,"time":1776398297121,"pid":95705,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-h","res":{"statusCode":500},"responseTime":3.383415997028351,"msg":"request completed"}
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/parse > should parse a service request into a structured post 8ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/parse > should handle markdown-wrapped JSON responses from AI 3ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/parse > should reject requests without authentication 1ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/parse > should reject text that is too short 1ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/parse > should fallback to first category when AI returns unknown slug 4ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/suggest-images > should suggest product images 2ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/suggest-images > should reject requests without authentication 0ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/generate-job-profile > should generate a job seeker profile 1ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/generate-job-profile > should generate an employer job posting 1ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > POST /api/v1/posts/ai/generate-job-profile > should reject text that is too short 1ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > Rate Limiting > should enforce rate limit after 20 requests 1ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > Error Handling > should handle AI returning invalid JSON 2ms
 ✓ tests/ai-assist.test.ts > AI-Assisted Post Creation > Error Handling > should handle AI service errors gracefully 4ms
{"level":30,"time":1776398297134,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-15","res":{"statusCode":200},"responseTime":538.3756659924984,"msg":"request completed"}
{"level":30,"time":1776398297135,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-16","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297388,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-16","res":{"statusCode":200},"responseTime":253.58008401095867,"msg":"request completed"}
{"level":30,"time":1776398297389,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-17","req":{"method":"POST","url":"/api/v1/auth/reset-password","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398297887,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-17","res":{"statusCode":200},"responseTime":498.36712500452995,"msg":"request completed"}
 ✓ tests/auth.test.ts > POST /api/v1/auth/reset-password > should reset password with valid token 1294ms
{"level":30,"time":1776398297890,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-18","req":{"method":"POST","url":"/api/v1/auth/login","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398298142,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-18","res":{"statusCode":200},"responseTime":252.5523750036955,"msg":"request completed"}
{"level":30,"time":1776398298143,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-19","req":{"method":"POST","url":"/api/v1/auth/reset-password","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398298655,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-19","res":{"statusCode":200},"responseTime":511.76604199409485,"msg":"request completed"}
{"level":30,"time":1776398298655,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1a","req":{"method":"POST","url":"/api/v1/auth/refresh","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398298656,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1a","res":{"statusCode":401},"responseTime":0.8737090080976486,"msg":"request completed"}
{"level":30,"time":1776398298656,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1b","req":{"method":"POST","url":"/api/v1/auth/reset-password","host":"localhost:80","remoteAddress":"127.0.0.1"},"msg":"incoming request"}
{"level":30,"time":1776398299163,"pid":95520,"hostname":"Faisals-MacBook-Pro.local","reqId":"req-1b","res":{"statusCode":200},"responseTime":506.53291699290276,"msg":"request completed"}
 ✓ tests/auth.test.ts > POST /api/v1/auth/reset-password > should invalidate all sessions after password reset 1275ms

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Suites 10 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/admin.test.ts [ tests/admin.test.ts ]
PrismaClientKnownRequestError: 
Invalid `prisma.post.create()` invocation in
/Users/faisalidris/ReverseMarketplace/backend/tests/admin.test.ts:92:34

  89 // First, need a transaction for the review
  90 const category = await prisma.category.findFirst({ where: { parentCategoryId: { not: null } } });
  91 
→ 92 const post = await prisma.post.create(
The column `is_seed` does not exist in the current database.
 ❯ zr.handleRequestError node_modules/@prisma/client/runtime/client.js:65:8172
 ❯ zr.handleAndLogRequestError node_modules/@prisma/client/runtime/client.js:65:7467
 ❯ zr.request node_modules/@prisma/client/runtime/client.js:65:7174
 ❯ a node_modules/@prisma/client/runtime/client.js:75:5816
 ❯ tests/admin.test.ts:92:16
     90|   const category = await prisma.category.findFirst({ where: { parentCategoryId: { not: null } } });
     91| 
     92|   const post = await prisma.post.create({
       |                ^
     93|     data: {
     94|       buyerId: regularUser.userId,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
Serialized Error: { code: 'P2022', meta: { modelName: 'Post', driverAdapterError: { stack: 'DriverAdapterError: ColumnNotFound\n    at PrismaPgAdapter.onError (file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/adapter-pg/dist/index.mjs:651:11)\n    at PrismaPgAdapter.performIO (file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/adapter-pg/dist/index.mjs:646:12)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at PrismaPgAdapter.queryRaw (file:///Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/adapter-pg/dist/index.mjs:566:30)\n    at e.interpretNode (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:11:43522)\n    at e.interpretNode (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:11:43962)\n    at e.interpretNode (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:11:45151)\n    at e.run (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:11:42242)\n    at execute (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:57:815)\n    at qt.request (/Users/faisalidris/ReverseMarketplace/backend/node_modules/@prisma/client/runtime/client.js:58:2327)', message: 'ColumnNotFound', name: 'DriverAdapterError', cause: { originalCode: '42703', originalMessage: 'column "is_seed" of relation "posts" does not exist', kind: 'ColumnNotFound', column: 'is_seed' }, constructor: 'Function<DriverAdapterError>', toString: 'Function<toString>' } }, clientVersion: '7.4.0', batchRequestIdx: undefined }
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/29]⎯

 FAIL  tests/disputes.test.ts [ tests/disputes.test.ts ]
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ tests/disputes.test.ts:152:27
    150|     },
    151|   });
    152|   postId = postRes.json().data.id;
       |                           ^
    153| 
    154|   // Submit offer

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/29]⎯

 FAIL  tests/messages.test.ts [ tests/messages.test.ts ]
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ tests/messages.test.ts:168:27
    166|     },
    167|   });
    168|   postId = postRes.json().data.id;
       |                           ^
    169| 
    170|   const offerRes = await app.inject({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/29]⎯

 FAIL  tests/offers.test.ts [ tests/offers.test.ts ]
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ tests/offers.test.ts:166:27
    164|     },
    165|   });
    166|   postId = postRes.json().data.id;
       |                           ^
    167| });
    168| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[4/29]⎯

 FAIL  tests/payments.test.ts [ tests/payments.test.ts ]
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ tests/payments.test.ts:208:27
    206|     },
    207|   });
    208|   postId = postRes.json().data.id;
       |                           ^
    209| 
    210|   const offerRes = await app.inject({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[5/29]⎯

 FAIL  tests/payouts.test.ts [ tests/payouts.test.ts ]
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ tests/payouts.test.ts:151:37
    149|     },
    150|   });
    151|   const testPostId = postRes.json().data.id;
       |                                     ^
    152| 
    153|   const offerRes = await app.inject({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[6/29]⎯

 FAIL  tests/reviews.test.ts [ tests/reviews.test.ts ]
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ tests/reviews.test.ts:166:32
    164|       },
    165|     });
    166|     const pId = postRes.json().data.id;
       |                                ^
    167| 
    168|     const offerRes = await app.inject({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[7/29]⎯

 FAIL  tests/search.test.ts [ tests/search.test.ts ]
AssertionError: expected 500 to be 201 // Object.is equality

- Expected
+ Received

- 201
+ 500

 ❯ tests/search.test.ts:96:28
     94|     },
     95|   });
     96|   expect(post1.statusCode).toBe(201);
       |                            ^
     97| 
     98|   const post2 = await app.inject({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[8/29]⎯

 FAIL  tests/socket.test.ts [ tests/socket.test.ts ]
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ tests/socket.test.ts:179:33
    177|     },
    178|   });
    179|   const postId = postRes.json().data.id;
       |                                 ^
    180| 
    181|   const offerRes = await app.inject({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[9/29]⎯

 FAIL  tests/transactions.test.ts [ tests/transactions.test.ts ]
TypeError: Cannot read properties of undefined (reading 'id')
 ❯ tests/transactions.test.ts:165:27
    163|     },
    164|   });
    165|   postId = postRes.json().data.id;
       |                           ^
    166| 
    167|   const offerRes = await app.inject({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[10/29]⎯


⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Failed Tests 19 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/posts.test.ts > POST /api/v1/posts > should create an active post
AssertionError: expected 500 to be 201 // Object.is equality

- Expected
+ Received

- 201
+ 500

 ❯ tests/posts.test.ts:123:28
    121|     });
    122| 
    123|     expect(res.statusCode).toBe(201);
       |                            ^
    124|     const body = res.json();
    125|     expect(body.success).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[11/29]⎯

 FAIL  tests/posts.test.ts > POST /api/v1/posts > should create a draft post
AssertionError: expected 500 to be 201 // Object.is equality

- Expected
+ Received

- 201
+ 500

 ❯ tests/posts.test.ts:142:28
    140|     });
    141| 
    142|     expect(res.statusCode).toBe(201);
       |                            ^
    143|     const body = res.json();
    144|     expect(body.data.status).toBe('draft');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/29]⎯

 FAIL  tests/posts.test.ts > GET /api/v1/posts/:postId > should return post details
AssertionError: expected 400 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 400

 ❯ tests/posts.test.ts:192:28
    190|     });
    191| 
    192|     expect(res.statusCode).toBe(200);
       |                            ^
    193|     const body = res.json();
    194|     expect(body.data.id).toBe(createdPostId);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/29]⎯

 FAIL  tests/posts.test.ts > GET /api/v1/posts/:postId > should return 404 for non-existent post
AssertionError: expected 500 to be 404 // Object.is equality

- Expected
+ Received

- 404
+ 500

 ❯ tests/posts.test.ts:205:28
    203|       url: '/api/v1/posts/00000000-0000-0000-0000-000000000000',
    204|     });
    205|     expect(res.statusCode).toBe(404);
       |                            ^
    206|   });
    207| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[14/29]⎯

 FAIL  tests/posts.test.ts > GET /api/v1/posts/:postId > should hide draft posts from non-owners
AssertionError: expected 400 to be 404 // Object.is equality

- Expected
+ Received

- 404
+ 400

 ❯ tests/posts.test.ts:214:28
    212|       // No auth — not the owner
    213|     });
    214|     expect(res.statusCode).toBe(404);
       |                            ^
    215|   });
    216| 

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[15/29]⎯

 FAIL  tests/posts.test.ts > GET /api/v1/posts/:postId > should show draft posts to owner
AssertionError: expected 400 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 400

 ❯ tests/posts.test.ts:223:28
    221|       headers: authHeaders(),
    222|     });
    223|     expect(res.statusCode).toBe(200);
       |                            ^
    224|     expect(res.json().data.status).toBe('draft');
    225|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[16/29]⎯

 FAIL  tests/posts.test.ts > GET /api/v1/posts/my-posts > should list my posts
AssertionError: expected 500 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 500

 ❯ tests/posts.test.ts:238:28
    236|     });
    237| 
    238|     expect(res.statusCode).toBe(200);
       |                            ^
    239|     const body = res.json();
    240|     expect(Array.isArray(body.data)).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[17/29]⎯

 FAIL  tests/posts.test.ts > GET /api/v1/posts/my-posts > should filter by status
AssertionError: expected 500 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 500

 ❯ tests/posts.test.ts:252:28
    250|     });
    251| 
    252|     expect(res.statusCode).toBe(200);
       |                            ^
    253|     const body = res.json();
    254|     body.data.forEach((post: { status: string }) => {

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[18/29]⎯

 FAIL  tests/posts.test.ts > PUT /api/v1/posts/:postId > should update post fields
AssertionError: expected 400 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 400

 ❯ tests/posts.test.ts:282:28
    280|     });
    281| 
    282|     expect(res.statusCode).toBe(200);
       |                            ^
    283|     const body = res.json();
    284|     expect(body.data.title).toBe('Updated plumbing post title here');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[19/29]⎯

 FAIL  tests/posts.test.ts > PUT /api/v1/posts/:postId > should publish a draft post
AssertionError: expected 400 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 400

 ❯ tests/posts.test.ts:296:28
    294|     });
    295| 
    296|     expect(res.statusCode).toBe(200);
       |                            ^
    297|     const body = res.json();
    298|     expect(body.data.status).toBe('active');

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[20/29]⎯

 FAIL  tests/posts.test.ts > PUT /api/v1/posts/:postId > should reject update from non-owner
AssertionError: expected 400 to be 403 // Object.is equality

- Expected
+ Received

- 403
+ 400

 ❯ tests/posts.test.ts:332:28
    330|       payload: { title: 'Hacked title that should not be allowed' },
    331|     });
    332|     expect(res.statusCode).toBe(403);
       |                            ^
    333| 
    334|     // Clean up

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[21/29]⎯

 FAIL  tests/posts.test.ts > POST /api/v1/posts/:postId/extend > should extend post by 3 days
TypeError: Cannot read properties of undefined (reading 'expiresAt')
 ❯ tests/posts.test.ts:348:54
    346|       headers: authHeaders(),
    347|     });
    348|     const originalExpiry = new Date(beforeRes.json().data.expiresAt).getTime();
       |                                                      ^
    349| 
    350|     const res = await app.inject({

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[22/29]⎯

 FAIL  tests/posts.test.ts > POST /api/v1/posts/:postId/extend > should reject double extension
AssertionError: expected 400 to be 409 // Object.is equality

- Expected
+ Received

- 409
+ 400

 ❯ tests/posts.test.ts:370:28
    368|       headers: authHeaders(),
    369|     });
    370|     expect(res.statusCode).toBe(409);
       |                            ^
    371|   });
    372| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[23/29]⎯

 FAIL  tests/posts.test.ts > POST /api/v1/posts/:postId/mark-filled > should mark post as filled
AssertionError: expected 400 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 400

 ❯ tests/posts.test.ts:385:28
    383|     });
    384| 
    385|     expect(res.statusCode).toBe(200);
       |                            ^
    386|     expect(res.json().data.status).toBe('filled');
    387|   });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[24/29]⎯

 FAIL  tests/posts.test.ts > POST /api/v1/posts/:postId/mark-filled > should reject marking non-active post as filled
AssertionError: expected 400 to be 409 // Object.is equality

- Expected
+ Received

- 409
+ 400

 ❯ tests/posts.test.ts:396:28
    394|       headers: authHeaders(),
    395|     });
    396|     expect(res.statusCode).toBe(409);
       |                            ^
    397|   });
    398| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[25/29]⎯

 FAIL  tests/posts.test.ts > POST /api/v1/posts/:postId/repost > should create a new post from existing one
AssertionError: expected 400 to be 201 // Object.is equality

- Expected
+ Received

- 201
+ 400

 ❯ tests/posts.test.ts:410:28
    408|     });
    409| 
    410|     expect(res.statusCode).toBe(201);
       |                            ^
    411|     const body = res.json();
    412|     expect(body.data.id).not.toBe(createdPostId); // New ID

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[26/29]⎯

 FAIL  tests/posts.test.ts > DELETE /api/v1/posts/:postId > should soft-delete a post
AssertionError: expected 400 to be 204 // Object.is equality

- Expected
+ Received

- 204
+ 400

 ❯ tests/posts.test.ts:429:28
    427|     });
    428| 
    429|     expect(res.statusCode).toBe(204);
       |                            ^
    430| 
    431|     // Verify it's gone from public view

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[27/29]⎯

 FAIL  tests/posts.test.ts > GET /api/v1/posts/feed > should return active posts
AssertionError: expected 500 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 500

 ❯ tests/posts.test.ts:449:28
    447|     });
    448| 
    449|     expect(res.statusCode).toBe(200);
       |                            ^
    450|     const body = res.json();
    451|     expect(Array.isArray(body.data)).toBe(true);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[28/29]⎯

 FAIL  tests/posts.test.ts > GET /api/v1/posts/feed > should filter by category
AssertionError: expected 500 to be 200 // Object.is equality

- Expected
+ Received

- 200
+ 500

 ❯ tests/posts.test.ts:465:28
    463|     });
    464| 
    465|     expect(res.statusCode).toBe(200);
       |                            ^
    466|     const body = res.json();
    467|     body.data.forEach((post: { categoryId: string }) => {

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[29/29]⎯


 Test Files  11 failed | 9 passed (20)
      Tests  19 failed | 121 passed | 158 skipped (298)
   Start at  22:58:07
   Duration  11.36s (transform 3.80s, setup 0ms, import 6.05s, tests 72.09s, environment 3ms)