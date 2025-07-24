(()=>{var e={};e.id=2225,e.ids=[2225],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},5069:(e,t,i)=>{"use strict";i.d(t,{L:()=>n,db:()=>s});var r=i(56621);async function n(){return await (0,r.b)()}let s=(0,r.b)()},5145:(e,t,i)=>{"use strict";var r=Object.defineProperty,n=Object.getOwnPropertyDescriptor,s=Object.getOwnPropertyNames,a=Object.prototype.hasOwnProperty,o=(e,t)=>{for(var i in t)r(e,i,{get:t[i],enumerable:!0})},l={};o(l,{Analytics:()=>u,IpDenyList:()=>k,MultiRegionRatelimit:()=>W,Ratelimit:()=>B}),e.exports=((e,t,i,o)=>{if(t&&"object"==typeof t||"function"==typeof t)for(let i of s(t))a.call(e,i)||void 0===i||r(e,i,{get:()=>t[i],enumerable:!(o=n(t,i))||o.enumerable});return e})(r({},"__esModule",{value:!0}),l);var c=i(97698),u=class{analytics;table="events";constructor(e){this.analytics=new c.Analytics({redis:e.redis,window:"1h",prefix:e.prefix??"@upstash/ratelimit",retention:"90d"})}extractGeo(e){return void 0!==e.geo?e.geo:void 0!==e.cf?e.cf:{}}async record(e){await this.analytics.ingest(this.table,e)}async series(e,t){let i=Math.min((this.analytics.getBucket(Date.now())-this.analytics.getBucket(t))/36e5,256);return this.analytics.aggregateBucketsWithPipeline(this.table,e,i)}async getUsage(e=0){let t=Math.min((this.analytics.getBucket(Date.now())-this.analytics.getBucket(e))/36e5,256);return await this.analytics.getAllowedBlocked(this.table,t)}async getUsageOverTime(e,t){return await this.analytics.aggregateBucketsWithPipeline(this.table,t,e)}async getMostAllowedBlocked(e,t,i){return t=t??5,this.analytics.getMostAllowedBlocked(this.table,e,t,void 0,i)}},d=class{cache;constructor(e){this.cache=e}isBlocked(e){if(!this.cache.has(e))return{blocked:!1,reset:0};let t=this.cache.get(e);return t<Date.now()?(this.cache.delete(e),{blocked:!1,reset:0}):{blocked:!0,reset:t}}blockUntil(e,t){this.cache.set(e,t)}set(e,t){this.cache.set(e,t)}get(e){return this.cache.get(e)||null}incr(e){let t=this.cache.get(e)??0;return t+=1,this.cache.set(e,t),t}pop(e){this.cache.delete(e)}empty(){this.cache.clear()}size(){return this.cache.size}};function m(e){let t=e.match(/^(\d+)\s?(ms|s|m|h|d)$/);if(!t)throw Error(`Unable to parse window size: ${e}`);let i=Number.parseInt(t[1]);switch(t[2]){case"ms":return i;case"s":return 1e3*i;case"m":return 1e3*i*60;case"h":return 1e3*i*3600;case"d":return 1e3*i*86400;default:throw Error(`Unable to parse window size: ${e}`)}}var h=async(e,t,i,r)=>{try{return await e.redis.evalsha(t.hash,i,r)}catch(n){if(`${n}`.includes("NOSCRIPT")){let n=await e.redis.scriptLoad(t.script);return n!==t.hash&&console.warn("Upstash Ratelimit: Expected hash and the hash received from Redis are different. Ratelimit will work as usual but performance will be reduced."),await e.redis.evalsha(n,i,r)}throw n}},p={singleRegion:{fixedWindow:{limit:{script:`
  local key           = KEYS[1]
  local window        = ARGV[1]
  local incrementBy   = ARGV[2] -- increment rate per request at a given value, default is 1

  local r = redis.call("INCRBY", key, incrementBy)
  if r == tonumber(incrementBy) then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end

  return r
`,hash:"b13943e359636db027ad280f1def143f02158c13"},getRemaining:{script:`
      local key = KEYS[1]
      local tokens = 0

      local value = redis.call('GET', key)
      if value then
          tokens = value
      end
      return tokens
    `,hash:"8c4c341934502aee132643ffbe58ead3450e5208"}},slidingWindow:{limit:{script:`
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local tokens      = tonumber(ARGV[1]) -- tokens per window
  local now         = ARGV[2]           -- current timestamp in milliseconds
  local window      = ARGV[3]           -- interval in milliseconds
  local incrementBy = ARGV[4]           -- increment rate per request at a given value, default is 1

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end
  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)
  if requestsInPreviousWindow + requestsInCurrentWindow >= tokens then
    return -1
  end

  local newValue = redis.call("INCRBY", currentKey, incrementBy)
  if newValue == tonumber(incrementBy) then
    -- The first time this key is set, the value will be equal to incrementBy.
    -- So we only need the expire command once
    redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
  end
  return tokens - ( newValue + requestsInPreviousWindow )
`,hash:"e1391e429b699c780eb0480350cd5b7280fd9213"},getRemaining:{script:`
  local currentKey  = KEYS[1]           -- identifier including prefixes
  local previousKey = KEYS[2]           -- key of the previous bucket
  local now         = ARGV[1]           -- current timestamp in milliseconds
  local window      = ARGV[2]           -- interval in milliseconds

  local requestsInCurrentWindow = redis.call("GET", currentKey)
  if requestsInCurrentWindow == false then
    requestsInCurrentWindow = 0
  end

  local requestsInPreviousWindow = redis.call("GET", previousKey)
  if requestsInPreviousWindow == false then
    requestsInPreviousWindow = 0
  end

  local percentageInCurrent = ( now % window ) / window
  -- weighted requests to consider from the previous window
  requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)

  return requestsInPreviousWindow + requestsInCurrentWindow
`,hash:"65a73ac5a05bf9712903bc304b77268980c1c417"}},tokenBucket:{limit:{script:`
  local key         = KEYS[1]           -- identifier including prefixes
  local maxTokens   = tonumber(ARGV[1]) -- maximum number of tokens
  local interval    = tonumber(ARGV[2]) -- size of the window in milliseconds
  local refillRate  = tonumber(ARGV[3]) -- how many tokens are refilled after each interval
  local now         = tonumber(ARGV[4]) -- current timestamp in milliseconds
  local incrementBy = tonumber(ARGV[5]) -- how many tokens to consume, default is 1
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")
        
  local refilledAt
  local tokens

  if bucket[1] == false then
    refilledAt = now
    tokens = maxTokens
  else
    refilledAt = tonumber(bucket[1])
    tokens = tonumber(bucket[2])
  end
        
  if now >= refilledAt + interval then
    local numRefills = math.floor((now - refilledAt) / interval)
    tokens = math.min(maxTokens, tokens + numRefills * refillRate)

    refilledAt = refilledAt + numRefills * interval
  end

  if tokens == 0 then
    return {-1, refilledAt + interval}
  end

  local remaining = tokens - incrementBy
  local expireAt = math.ceil(((maxTokens - remaining) / refillRate)) * interval
        
  redis.call("HSET", key, "refilledAt", refilledAt, "tokens", remaining)
  redis.call("PEXPIRE", key, expireAt)
  return {remaining, refilledAt + interval}
`,hash:"5bece90aeef8189a8cfd28995b479529e270b3c6"},getRemaining:{script:`
  local key         = KEYS[1]
  local maxTokens   = tonumber(ARGV[1])
        
  local bucket = redis.call("HMGET", key, "refilledAt", "tokens")

  if bucket[1] == false then
    return {maxTokens, -1}
  end
        
  return {tonumber(bucket[2]), tonumber(bucket[1])}
`,hash:"a15be2bb1db2a15f7c82db06146f9d08983900d0"}},cachedFixedWindow:{limit:{script:`
  local key     = KEYS[1]
  local window  = ARGV[1]
  local incrementBy   = ARGV[2] -- increment rate per request at a given value, default is 1

  local r = redis.call("INCRBY", key, incrementBy)
  if r == incrementBy then
  -- The first time this key is set, the value will be equal to incrementBy.
  -- So we only need the expire command once
  redis.call("PEXPIRE", key, window)
  end
      
  return r
`,hash:"c26b12703dd137939b9a69a3a9b18e906a2d940f"},getRemaining:{script:`
  local key = KEYS[1]
  local tokens = 0

  local value = redis.call('GET', key)
  if value then
      tokens = value
  end
  return tokens
`,hash:"8e8f222ccae68b595ee6e3f3bf2199629a62b91a"}}},multiRegion:{fixedWindow:{limit:{script:`
	local key           = KEYS[1]
	local id            = ARGV[1]
	local window        = ARGV[2]
	local incrementBy   = tonumber(ARGV[3])

	redis.call("HSET", key, id, incrementBy)
	local fields = redis.call("HGETALL", key)
	if #fields == 2 and tonumber(fields[2])==incrementBy then
	-- The first time this key is set, and the value will be equal to incrementBy.
	-- So we only need the expire command once
	  redis.call("PEXPIRE", key, window)
	end

	return fields
`,hash:"a8c14f3835aa87bd70e5e2116081b81664abcf5c"},getRemaining:{script:`
      local key = KEYS[1]
      local tokens = 0

      local fields = redis.call("HGETALL", key)

      return fields
    `,hash:"8ab8322d0ed5fe5ac8eb08f0c2e4557f1b4816fd"}},slidingWindow:{limit:{script:`
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local tokens        = tonumber(ARGV[1]) -- tokens per window
	local now           = ARGV[2]           -- current timestamp in milliseconds
	local window        = ARGV[3]           -- interval in milliseconds
	local requestId     = ARGV[4]           -- uuid for this request
	local incrementBy   = tonumber(ARGV[5]) -- custom rate, default is  1

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window
	if requestsInPreviousWindow * (1 - percentageInCurrent ) + requestsInCurrentWindow >= tokens then
	  return {currentFields, previousFields, false}
	end

	redis.call("HSET", currentKey, requestId, incrementBy)

	if requestsInCurrentWindow == 0 then 
	  -- The first time this key is set, the value will be equal to incrementBy.
	  -- So we only need the expire command once
	  redis.call("PEXPIRE", currentKey, window * 2 + 1000) -- Enough time to overlap with a new window + 1 second
	end
	return {currentFields, previousFields, true}
`,hash:"cb4fdc2575056df7c6d422764df0de3a08d6753b"},getRemaining:{script:`
	local currentKey    = KEYS[1]           -- identifier including prefixes
	local previousKey   = KEYS[2]           -- key of the previous bucket
	local now         	= ARGV[1]           -- current timestamp in milliseconds
  	local window      	= ARGV[2]           -- interval in milliseconds

	local currentFields = redis.call("HGETALL", currentKey)
	local requestsInCurrentWindow = 0
	for i = 2, #currentFields, 2 do
	requestsInCurrentWindow = requestsInCurrentWindow + tonumber(currentFields[i])
	end

	local previousFields = redis.call("HGETALL", previousKey)
	local requestsInPreviousWindow = 0
	for i = 2, #previousFields, 2 do
	requestsInPreviousWindow = requestsInPreviousWindow + tonumber(previousFields[i])
	end

	local percentageInCurrent = ( now % window) / window
  	requestsInPreviousWindow = math.floor(( 1 - percentageInCurrent ) * requestsInPreviousWindow)
	
	return requestsInCurrentWindow + requestsInPreviousWindow
`,hash:"558c9306b7ec54abb50747fe0b17e5d44bd24868"}}}},f={script:`
      local pattern = KEYS[1]

      -- Initialize cursor to start from 0
      local cursor = "0"

      repeat
          -- Scan for keys matching the pattern
          local scan_result = redis.call('SCAN', cursor, 'MATCH', pattern)

          -- Extract cursor for the next iteration
          cursor = scan_result[1]

          -- Extract keys from the scan result
          local keys = scan_result[2]

          for i=1, #keys do
          redis.call('DEL', keys[i])
          end

      -- Continue scanning until cursor is 0 (end of keyspace)
      until cursor == "0"
    `,hash:"54bd274ddc59fb3be0f42deee2f64322a10e2b50"},g="denyList",w="ipDenyList",y="ipDenyListStatus",b=`
  -- Checks if values provideed in ARGV are present in the deny lists.
  -- This is done using the allDenyListsKey below.

  -- Additionally, checks the status of the ip deny list using the
  -- ipDenyListStatusKey below. Here are the possible states of the
  -- ipDenyListStatusKey key:
  -- * status == -1: set to "disabled" with no TTL
  -- * status == -2: not set, meaning that is was set before but expired
  -- * status  >  0: set to "valid", with a TTL
  --
  -- In the case of status == -2, we set the status to "pending" with
  -- 30 second ttl. During this time, the process which got status == -2
  -- will update the ip deny list.

  local allDenyListsKey     = KEYS[1]
  local ipDenyListStatusKey = KEYS[2]

  local results = redis.call('SMISMEMBER', allDenyListsKey, unpack(ARGV))
  local status  = redis.call('TTL', ipDenyListStatusKey)
  if status == -2 then
    redis.call('SETEX', ipDenyListStatusKey, 30, "pending")
  end

  return { results, status }
`,k={};o(k,{ThresholdError:()=>x,disableIpDenyList:()=>E,updateIpDenyList:()=>I});var v=e=>864e5-((e||Date.now())-72e5)%864e5,x=class extends Error{constructor(e){super(`Allowed threshold values are from 1 to 8, 1 and 8 included. Received: ${e}`),this.name="ThresholdError"}},R=async e=>{if("number"!=typeof e||e<1||e>8)throw new x(e);try{let t=await fetch(`https://raw.githubusercontent.com/stamparm/ipsum/master/levels/${e}.txt`);if(!t.ok)throw Error(`Error fetching data: ${t.statusText}`);return(await t.text()).split("\n").filter(e=>e.length>0)}catch(e){throw Error(`Failed to fetch ip deny list: ${e}`)}},I=async(e,t,i,r)=>{let n=await R(i),s=[t,g,"all"].join(":"),a=[t,g,w].join(":"),o=[t,y].join(":"),l=e.multi();return l.sdiffstore(s,s,a),l.del(a),l.sadd(a,n.at(0),...n.slice(1)),l.sdiffstore(a,a,s),l.sunionstore(s,s,a),l.set(o,"valid",{px:r??v()}),await l.exec()},E=async(e,t)=>{let i=[t,g,"all"].join(":"),r=[t,g,w].join(":"),n=[t,y].join(":"),s=e.multi();return s.sdiffstore(i,i,r),s.del(r),s.set(n,"disabled"),await s.exec()},T=new d(new Map),A=e=>e.find(e=>T.isBlocked(e).blocked),P=e=>{T.size()>1e3&&T.empty(),T.blockUntil(e,Date.now()+6e4)},q=async(e,t,i)=>{let r,[n,s]=await e.eval(b,[[t,g,"all"].join(":"),[t,y].join(":")],i);return n.map((e,t)=>{e&&(P(i[t]),r=i[t])}),{deniedValue:r,invalidIpDenyList:-2===s}},L=(e,t,[i,r],n)=>{if(r.deniedValue&&(i.success=!1,i.remaining=0,i.reason="denyList",i.deniedValue=r.deniedValue),r.invalidIpDenyList){let r=I(e,t,n);i.pending=Promise.all([i.pending,r])}return i},S=e=>({success:!1,limit:0,remaining:0,reset:0,pending:Promise.resolve(),reason:"denyList",deniedValue:e}),_=class{limiter;ctx;prefix;timeout;primaryRedis;analytics;enableProtection;denyListThreshold;constructor(e){this.ctx=e.ctx,this.limiter=e.limiter,this.timeout=e.timeout??5e3,this.prefix=e.prefix??"@upstash/ratelimit",this.enableProtection=e.enableProtection??!1,this.denyListThreshold=e.denyListThreshold??6,this.primaryRedis="redis"in this.ctx?this.ctx.redis:this.ctx.regionContexts[0].redis,this.analytics=e.analytics?new u({redis:this.primaryRedis,prefix:this.prefix}):void 0,e.ephemeralCache instanceof Map?this.ctx.cache=new d(e.ephemeralCache):void 0===e.ephemeralCache&&(this.ctx.cache=new d(new Map))}limit=async(e,t)=>{let i=null;try{let r=this.getRatelimitResponse(e,t),{responseArray:n,newTimeoutId:s}=this.applyTimeout(r);i=s;let a=await Promise.race(n);return this.submitAnalytics(a,e,t)}finally{i&&clearTimeout(i)}};blockUntilReady=async(e,t)=>{let i;if(t<=0)throw Error("timeout must be positive");let r=Date.now()+t;for(;!(i=await this.limit(e)).success;){if(0===i.reset)throw Error("This should not happen");let e=Math.min(i.reset,r)-Date.now();if(await new Promise(t=>setTimeout(t,e)),Date.now()>r)break}return i};resetUsedTokens=async e=>{let t=[this.prefix,e].join(":");await this.limiter().resetTokens(this.ctx,t)};getRemaining=async e=>{let t=[this.prefix,e].join(":");return await this.limiter().getRemaining(this.ctx,t)};getRatelimitResponse=async(e,t)=>{let i=this.getKey(e),r=this.getDefinedMembers(e,t),n=A(r),s=n?[S(n),{deniedValue:n,invalidIpDenyList:!1}]:await Promise.all([this.limiter().limit(this.ctx,i,t?.rate),this.enableProtection?q(this.primaryRedis,this.prefix,r):{deniedValue:void 0,invalidIpDenyList:!1}]);return L(this.primaryRedis,this.prefix,s,this.denyListThreshold)};applyTimeout=e=>{let t=null,i=[e];if(this.timeout>0){let e=new Promise(e=>{t=setTimeout(()=>{e({success:!0,limit:0,remaining:0,reset:0,pending:Promise.resolve(),reason:"timeout"})},this.timeout)});i.push(e)}return{responseArray:i,newTimeoutId:t}};submitAnalytics=(e,t,i)=>{if(this.analytics)try{let r=i?this.analytics.extractGeo(i):void 0,n=this.analytics.record({identifier:"denyList"===e.reason?e.deniedValue:t,time:Date.now(),success:"denyList"===e.reason?"denied":e.success,...r}).catch(e=>{let t="Failed to record analytics";`${e}`.includes("WRONGTYPE")&&(t=`
    Failed to record analytics. See the information below:

    This can occur when you uprade to Ratelimit version 1.1.2
    or later from an earlier version.

    This occurs simply because the way we store analytics data
    has changed. To avoid getting this error, disable analytics
    for *an hour*, then simply enable it back.

    `),console.warn(t,e)});e.pending=Promise.all([e.pending,n])}catch(e){console.warn("Failed to record analytics",e)}return e};getKey=e=>[this.prefix,e].join(":");getDefinedMembers=(e,t)=>[e,t?.ip,t?.userAgent,t?.country].filter(Boolean)};function j(){let e="",t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",i=t.length;for(let r=0;r<16;r++)e+=t.charAt(Math.floor(Math.random()*i));return e}var W=class extends _{constructor(e){super({prefix:e.prefix,limiter:e.limiter,timeout:e.timeout,analytics:e.analytics,ctx:{regionContexts:e.redis.map(e=>({redis:e})),cache:e.ephemeralCache?new d(e.ephemeralCache):void 0}})}static fixedWindow(e,t){let i=m(t);return()=>({async limit(t,r,n){if(t.cache){let{blocked:i,reset:n}=t.cache.isBlocked(r);if(i)return{success:!1,limit:e,remaining:0,reset:n,pending:Promise.resolve(),reason:"cacheBlock"}}let s=j(),a=Math.floor(Date.now()/i),o=[r,a].join(":"),l=n?Math.max(1,n):1,c=t.regionContexts.map(e=>({redis:e.redis,request:h(e,p.multiRegion.fixedWindow.limit,[o],[s,i,l])})),u=e-(await Promise.any(c.map(e=>e.request))).reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0);async function d(){let t=[...new Set((await Promise.all(c.map(e=>e.request))).flat().reduce((e,t,i)=>(i%2==0&&e.push(t),e),[])).values()];for(let i of c){let r=(await i.request).reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0),n=(await i.request).reduce((e,t,i)=>(i%2==0&&e.push(t),e),[]);if(r>=e)continue;let s=t.filter(e=>!n.includes(e));if(0!==s.length)for(let e of s)await i.redis.hset(o,{[e]:l})}}let m=u>0,f=(a+1)*i;return t.cache&&!m&&t.cache.blockUntil(r,f),{success:m,limit:e,remaining:u,reset:f,pending:d()}},async getRemaining(t,r){let n=Math.floor(Date.now()/i),s=[r,n].join(":"),a=t.regionContexts.map(e=>({redis:e.redis,request:h(e,p.multiRegion.fixedWindow.getRemaining,[s],[null])}));return{remaining:Math.max(0,e-(await Promise.any(a.map(e=>e.request))).reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0)),reset:(n+1)*i}},async resetTokens(e,t){let i=[t,"*"].join(":");e.cache&&e.cache.pop(t),await Promise.all(e.regionContexts.map(e=>{h(e,f,[i],[null])}))}})}static slidingWindow(e,t){let i=m(t),r=m(t);return()=>({async limit(t,n,s){if(t.cache){let{blocked:i,reset:r}=t.cache.isBlocked(n);if(i)return{success:!1,limit:e,remaining:0,reset:r,pending:Promise.resolve(),reason:"cacheBlock"}}let a=j(),o=Date.now(),l=Math.floor(o/i),c=[n,l].join(":"),u=[n,l-1].join(":"),d=s?Math.max(1,s):1,m=t.regionContexts.map(t=>({redis:t.redis,request:h(t,p.multiRegion.slidingWindow.limit,[c,u],[e,o,r,a,d])})),f=o%r/r,[g,w,y]=await Promise.any(m.map(e=>e.request));y&&g.push(a,d.toString());let b=w.reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0),k=g.reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0),v=e-(Math.ceil(b*(1-f))+k);async function x(){let t=[...new Set((await Promise.all(m.map(e=>e.request))).flatMap(([e])=>e).reduce((e,t,i)=>(i%2==0&&e.push(t),e),[])).values()];for(let i of m){let[r,n,s]=await i.request,a=r.reduce((e,t,i)=>(i%2==0&&e.push(t),e),[]);if(r.reduce((e,t,i)=>{let r=0;return i%2&&(r=Number.parseInt(t)),e+r},0)>=e)continue;let o=t.filter(e=>!a.includes(e));if(0!==o.length)for(let e of o)await i.redis.hset(c,{[e]:d})}}let R=(l+1)*r;return t.cache&&!y&&t.cache.blockUntil(n,R),{success:!!y,limit:e,remaining:Math.max(0,v),reset:R,pending:x()}},async getRemaining(t,r){let n=Date.now(),s=Math.floor(n/i),a=[r,s].join(":"),o=[r,s-1].join(":"),l=t.regionContexts.map(e=>({redis:e.redis,request:h(e,p.multiRegion.slidingWindow.getRemaining,[a,o],[n,i])}));return{remaining:Math.max(0,e-await Promise.any(l.map(e=>e.request))),reset:(s+1)*i}},async resetTokens(e,t){let i=[t,"*"].join(":");e.cache&&e.cache.pop(t),await Promise.all(e.regionContexts.map(e=>{h(e,f,[i],[null])}))}})}},B=class extends _{constructor(e){super({prefix:e.prefix,limiter:e.limiter,timeout:e.timeout,analytics:e.analytics,ctx:{redis:e.redis},ephemeralCache:e.ephemeralCache,enableProtection:e.enableProtection,denyListThreshold:e.denyListThreshold})}static fixedWindow(e,t){let i=m(t);return()=>({async limit(t,r,n){let s=Math.floor(Date.now()/i),a=[r,s].join(":");if(t.cache){let{blocked:i,reset:n}=t.cache.isBlocked(r);if(i)return{success:!1,limit:e,remaining:0,reset:n,pending:Promise.resolve(),reason:"cacheBlock"}}let o=n?Math.max(1,n):1,l=await h(t,p.singleRegion.fixedWindow.limit,[a],[i,o]),c=l<=e,u=Math.max(0,e-l),d=(s+1)*i;return t.cache&&!c&&t.cache.blockUntil(r,d),{success:c,limit:e,remaining:u,reset:d,pending:Promise.resolve()}},async getRemaining(t,r){let n=Math.floor(Date.now()/i),s=[r,n].join(":");return{remaining:Math.max(0,e-await h(t,p.singleRegion.fixedWindow.getRemaining,[s],[null])),reset:(n+1)*i}},async resetTokens(e,t){let i=[t,"*"].join(":");e.cache&&e.cache.pop(t),await h(e,f,[i],[null])}})}static slidingWindow(e,t){let i=m(t);return()=>({async limit(t,r,n){let s=Date.now(),a=Math.floor(s/i),o=[r,a].join(":"),l=[r,a-1].join(":");if(t.cache){let{blocked:i,reset:n}=t.cache.isBlocked(r);if(i)return{success:!1,limit:e,remaining:0,reset:n,pending:Promise.resolve(),reason:"cacheBlock"}}let c=n?Math.max(1,n):1,u=await h(t,p.singleRegion.slidingWindow.limit,[o,l],[e,s,i,c]),d=u>=0,m=(a+1)*i;return t.cache&&!d&&t.cache.blockUntil(r,m),{success:d,limit:e,remaining:Math.max(0,u),reset:m,pending:Promise.resolve()}},async getRemaining(t,r){let n=Date.now(),s=Math.floor(n/i),a=[r,s].join(":"),o=[r,s-1].join(":");return{remaining:Math.max(0,e-await h(t,p.singleRegion.slidingWindow.getRemaining,[a,o],[n,i])),reset:(s+1)*i}},async resetTokens(e,t){let i=[t,"*"].join(":");e.cache&&e.cache.pop(t),await h(e,f,[i],[null])}})}static tokenBucket(e,t,i){let r=m(t);return()=>({async limit(t,n,s){if(t.cache){let{blocked:e,reset:r}=t.cache.isBlocked(n);if(e)return{success:!1,limit:i,remaining:0,reset:r,pending:Promise.resolve(),reason:"cacheBlock"}}let a=Date.now(),o=s?Math.max(1,s):1,[l,c]=await h(t,p.singleRegion.tokenBucket.limit,[n],[i,r,e,a,o]),u=l>=0;return t.cache&&!u&&t.cache.blockUntil(n,c),{success:u,limit:i,remaining:l,reset:c,pending:Promise.resolve()}},async getRemaining(e,t){let[n,s]=await h(e,p.singleRegion.tokenBucket.getRemaining,[t],[i]),a=Date.now()+r,o=s+r;return{remaining:n,reset:-1===s?a:o}},async resetTokens(e,t){e.cache&&e.cache.pop(t),await h(e,f,[t],[null])}})}static cachedFixedWindow(e,t){let i=m(t);return()=>({async limit(t,r,n){if(!t.cache)throw Error("This algorithm requires a cache");let s=Math.floor(Date.now()/i),a=[r,s].join(":"),o=(s+1)*i,l=n?Math.max(1,n):1;if("number"==typeof t.cache.get(a)){let r=t.cache.incr(a),n=r<e,s=n?h(t,p.singleRegion.cachedFixedWindow.limit,[a],[i,l]):Promise.resolve();return{success:n,limit:e,remaining:e-r,reset:o,pending:s}}let c=await h(t,p.singleRegion.cachedFixedWindow.limit,[a],[i,l]);t.cache.set(a,c);let u=e-c;return{success:u>=0,limit:e,remaining:u,reset:o,pending:Promise.resolve()}},async getRemaining(t,r){if(!t.cache)throw Error("This algorithm requires a cache");let n=Math.floor(Date.now()/i),s=[r,n].join(":");return"number"==typeof t.cache.get(s)?{remaining:Math.max(0,e-(t.cache.get(s)??0)),reset:(n+1)*i}:{remaining:Math.max(0,e-await h(t,p.singleRegion.cachedFixedWindow.getRemaining,[s],[null])),reset:(n+1)*i}},async resetTokens(e,t){if(!e.cache)throw Error("This algorithm requires a cache");let r=[t,Math.floor(Date.now()/i)].join(":");e.cache.pop(r);let n=[t,"*"].join(":");await h(e,f,[n],[null])}})}}},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:e=>{"use strict";e.exports=require("punycode")},27910:e=>{"use strict";e.exports=require("stream")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},34631:e=>{"use strict";e.exports=require("tls")},36463:(e,t,i)=>{"use strict";i.d(t,{v:()=>n});class r{constructor(){this.logLevel=process.env.NEXT_PUBLIC_LOG_LEVEL||"info",this.setupProductionLogging()}static getInstance(){return r.instance||(r.instance=new r),r.instance}shouldLog(e){let t={debug:0,info:1,warn:2,error:3};return t[e]>=t[this.logLevel]}formatMessage(e,t,i){let r=new Date().toISOString(),n=i?` ${JSON.stringify(i)}`:"";return`[${r}] [${e.toUpperCase()}] ${t}${n}`}async setupProductionLogging(){try{let{getEnvVar:e}=await Promise.resolve().then(i.bind(i,43294)),t=await e("LOGGING_SERVICE");if("sentry"===t)await e("SENTRY_DSN")&&console.warn("Sentry logging not available in Cloudflare Workers environment");else if("logflare"===t){let t=await e("LOGFLARE_API_KEY"),i=await e("LOGFLARE_SOURCE_ID");t&&i&&console.warn("Winston-Logflare logging not available in Cloudflare Workers environment")}else if("datadog"===t){let t=await e("DATADOG_API_KEY");if(t){let{datadogLogs:e}=await i.e(6666).then(i.bind(i,96666));e.init({clientToken:t,site:"datadoghq.com",forwardErrorsToLogs:!0}),this.productionLogger=e}}}catch(e){console.error("Failed to initialize production logging:",e)}}debug(e,t){this.shouldLog("debug")&&console.debug(this.formatMessage("debug",e,t))}info(e,t){this.shouldLog("info")&&(console.info(this.formatMessage("info",e,t)),this.productionLogger&&(this.productionLogger.captureMessage?this.productionLogger.captureMessage(e,"info",t):this.productionLogger.logger&&this.productionLogger.logger.info(e,t)))}warn(e,t){this.shouldLog("warn")&&(console.warn(this.formatMessage("warn",e,t)),this.productionLogger&&(this.productionLogger.captureMessage?this.productionLogger.captureMessage(e,"warning",t):this.productionLogger.logger&&this.productionLogger.logger.warn(e,t)))}error(e,t,i){if(this.shouldLog("error")){let r=t?{error:t.message||t,stack:t.stack}:{};console.error(this.formatMessage("error",e,{...i,...r})),this.productionLogger&&(this.productionLogger.captureException?this.productionLogger.captureException(t||Error(e),{contexts:{context:i}}):this.productionLogger.logger&&this.productionLogger.logger.error(e,{...i,...r}))}}}let n=r.getInstance()},39727:()=>{},43294:(e,t,i)=>{"use strict";i.d(t,{getEnvVar:()=>s});var r=i(62426);async function n(){try{return(await (0,r.DM)()).env}catch(e){return process.env}}async function s(e){return(await n())[e]}},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},47990:()=>{},55511:e=>{"use strict";e.exports=require("crypto")},55591:e=>{"use strict";e.exports=require("https")},56621:(e,t,i)=>{"use strict";i.d(t,{b:()=>a});var r=i(66437),n=i(43294);let s=null;async function a(){if(!s){let e=await (0,n.getEnvVar)("NEXT_PUBLIC_SUPABASE_URL"),t=await (0,n.getEnvVar)("NEXT_PUBLIC_SUPABASE_ANON_KEY");if(!e||!t)throw Error("Missing Supabase configuration");s=(0,r.UU)(e,t)}return s}(0,r.UU)("https://tqlnqqrrpzmdpgijxiqk.supabase.co","eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbG5xcXJycHptZHBnaWp4aXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTUwNjAsImV4cCI6MjA2NjY5MTA2MH0.ZDCY7DSswAgcUHFlDl3S0BDDXpX3qmyViWXsIGFhwkw")},60547:(e,t,i)=>{"use strict";i.d(t,{ON:()=>n,v7:()=>r});class r{constructor(e,t=100){this.kv=e,this.defaultLimit=t}async checkLimit(e,t=864e5,i=this.defaultLimit){let r=Date.now(),n=await this.kv.get(`rate_limit:${e}`,"json");if(!n||n.resetTime<r-t){let n=r+t;return await this.kv.put(`rate_limit:${e}`,JSON.stringify({count:1,resetTime:n}),{expirationTtl:Math.ceil(t/1e3)}),{allowed:!0,remaining:i-1,resetTime:n}}if(n.count>=i)return{allowed:!1,remaining:0,resetTime:n.resetTime};let s=n.count+1;return await this.kv.put(`rate_limit:${e}`,JSON.stringify({count:s,resetTime:n.resetTime}),{expirationTtl:Math.ceil((n.resetTime-r)/1e3)}),{allowed:!0,remaining:i-s,resetTime:n.resetTime}}}class n{constructor(e){this.kv=e}async get(e){return await this.kv.get(e,"json")}async set(e,t,i){await this.kv.put(e,JSON.stringify(t),i?{expirationTtl:i}:void 0)}async delete(e){await this.kv.delete(e)}}},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},74075:e=>{"use strict";e.exports=require("zlib")},77598:e=>{"use strict";e.exports=require("node:crypto")},78335:()=>{},79428:e=>{"use strict";e.exports=require("buffer")},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},83503:(e,t,i)=>{"use strict";i.r(t),i.d(t,{patchFetch:()=>L,routeModule:()=>T,serverHooks:()=>q,workAsyncStorage:()=>A,workUnitAsyncStorage:()=>P});var r={};i.r(r),i.d(r,{GET:()=>E,POST:()=>I});var n=i(96559),s=i(48088),a=i(37719),o=i(32190),l=i(72289),c=i(35282),u=i(5069),d=i(5145),m=i(32846),h=i(36463),p=i(43294),f=i(60547);let g=null,w=null,y=!1;async function b(){if(!y){try{let e=await (0,p.getEnvVar)("UPSTASH_REDIS_REST_URL"),t=await (0,p.getEnvVar)("UPSTASH_REDIS_REST_TOKEN");if(e&&t)g=new m.Q({url:e,token:t});else try{let e=globalThis.RATE_LIMIT||globalThis.ENV?.RATE_LIMIT;e&&(w=new f.v7(e))}catch{}}catch(e){}y=!0}}function k(){if(!g)throw Error("Redis not initialized for rate limiting");return g}let v={waitlist:async()=>(await b(),new d.Ratelimit({redis:k(),limiter:d.Ratelimit.slidingWindow(5,"1 h"),analytics:!0,prefix:"ratelimit:waitlist"}))};async function x(e,t){try{await b();let i="function"==typeof t?await t():t;if(!g&&w){let t=await w.checkLimit(e,6e4,60);return{success:t.allowed,limit:60,remaining:t.remaining,reset:new Date(t.resetTime)}}let r=await i.limit(e);return{success:r.success,limit:r.limit,remaining:r.remaining,reset:new Date(r.reset)}}catch(e){return h.v.error("Rate limit check error",e),{success:!0,limit:0,remaining:0,reset:new Date}}}let R=l.Ik({email:l.Yj().email("Invalid email address"),name:l.Yj().optional(),source:l.Yj().optional()});async function I(e){try{let t=e.headers.get("x-forwarded-for")||"anonymous";if(!(await x(t,v.waitlist)).success)return o.NextResponse.json({error:"Too many requests. Please try again later."},{status:429});let i=await e.json(),r=R.parse(i),n=await (0,u.L)(),{data:s}=await n.from("waitlist").select("id").eq("email",r.email).single();if(s)return o.NextResponse.json({error:"Email already on waitlist"},{status:409});let{data:a,error:l}=await n.from("waitlist").insert({email:r.email,name:r.name||null,source:r.source||"website"}).select().single();if(l)return h.v.error("Waitlist insertion error",l),o.NextResponse.json({error:"Failed to add to waitlist"},{status:500});return o.NextResponse.json({success:!0,message:"Successfully joined waitlist",data:a},{status:201})}catch(e){if(e instanceof c.G)return o.NextResponse.json({error:"Invalid input",details:e.errors},{status:400});return h.v.error("Waitlist API error",e),o.NextResponse.json({error:"Internal server error"},{status:500})}}async function E(e){let{searchParams:t}=new URL(e.url),i=t.get("email");if(!i)return o.NextResponse.json({error:"Email parameter required"},{status:400});try{let e=await (0,u.L)(),{data:t,error:r}=await e.from("waitlist").select("status, created_at").eq("email",i).single();if(r&&"PGRST116"!==r.code)return h.v.error("Waitlist check error",r),o.NextResponse.json({error:"Failed to check waitlist status"},{status:500});return o.NextResponse.json({onWaitlist:!!t,status:t?.status||null,joinedAt:t?.created_at||null})}catch(e){return h.v.error("Waitlist check API error",e),o.NextResponse.json({error:"Internal server error"},{status:500})}}let T=new n.AppRouteRouteModule({definition:{kind:s.RouteKind.APP_ROUTE,page:"/api/waitlist/route",pathname:"/api/waitlist",filename:"route",bundlePath:"app/api/waitlist/route"},resolvedPagePath:"/home/new_username/Documents/projects/aiamrkerv2/worktrees/claude/src/app/api/waitlist/route.ts",nextConfigOutput:"standalone",userland:r}),{workAsyncStorage:A,workUnitAsyncStorage:P,serverHooks:q}=T;function L(){return(0,a.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:P})}},91645:e=>{"use strict";e.exports=require("net")},94735:e=>{"use strict";e.exports=require("events")},96487:()=>{},97698:e=>{"use strict";var t=Object.defineProperty,i=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,n=Object.prototype.hasOwnProperty,s={};((e,i)=>{for(var r in i)t(e,r,{get:i[r],enumerable:!0})})(s,{Analytics:()=>c}),e.exports=((e,s,a,o)=>{if(s&&"object"==typeof s||"function"==typeof s)for(let a of r(s))n.call(e,a)||void 0===a||t(e,a,{get:()=>s[a],enumerable:!(o=i(s,a))||o.enumerable});return e})(t({},"__esModule",{value:!0}),s);var a=`
local key = KEYS[1]
local field = ARGV[1]

local data = redis.call("ZRANGE", key, 0, -1, "WITHSCORES")
local count = {}

for i = 1, #data, 2 do
  local json_str = data[i]
  local score = tonumber(data[i + 1])
  local obj = cjson.decode(json_str)

  local fieldValue = obj[field]

  if count[fieldValue] == nil then
    count[fieldValue] = score
  else
    count[fieldValue] = count[fieldValue] + score
  end
end

local result = {}
for k, v in pairs(count) do
  table.insert(result, {k, v})
end

return result
`,o=`
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1]) -- First timestamp to check
local increment = tonumber(ARGV[2])       -- Increment between each timestamp
local num_timestamps = tonumber(ARGV[3])  -- Number of timestampts to check (24 for a day and 24 * 7 for a week)
local num_elements = tonumber(ARGV[4])    -- Number of elements to fetch in each category
local check_at_most = tonumber(ARGV[5])   -- Number of elements to check at most.

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

-- select num_elements many items
local true_group = {}
local false_group = {}
local denied_group = {}
local true_count = 0
local false_count = 0
local denied_count = 0
local i = #result - 1

-- index to stop at after going through "checkAtMost" many items:
local cutoff_index = #result - 2 * check_at_most

-- iterate over the results
while (true_count + false_count + denied_count) < (num_elements * 3) and 1 <= i and i >= cutoff_index do
  local score = tonumber(result[i + 1])
  if score > 0 then
    local element = result[i]
    if string.find(element, "success\\":true") and true_count < num_elements then
      table.insert(true_group, {score, element})
      true_count = true_count + 1
    elseif string.find(element, "success\\":false") and false_count < num_elements then
      table.insert(false_group, {score, element})
      false_count = false_count + 1
    elseif string.find(element, "success\\":\\"denied") and denied_count < num_elements then
      table.insert(denied_group, {score, element})
      denied_count = denied_count + 1
    end
  end
  i = i - 2
end

return {true_group, false_group, denied_group}
`,l=`
local prefix = KEYS[1]
local first_timestamp = tonumber(ARGV[1])
local increment = tonumber(ARGV[2])
local num_timestamps = tonumber(ARGV[3])

local keys = {}
for i = 1, num_timestamps do
  local timestamp = first_timestamp - (i - 1) * increment
  table.insert(keys, prefix .. ":" .. timestamp)
end

-- get the union of the groups
local zunion_params = {"ZUNION", num_timestamps, unpack(keys)}
table.insert(zunion_params, "WITHSCORES")
local result = redis.call(unpack(zunion_params))

return result
`,c=class{redis;prefix;bucketSize;constructor(e){this.redis=e.redis,this.prefix=e.prefix??"@upstash/analytics",this.bucketSize=this.parseWindow(e.window)}validateTableName(e){if(!/^[a-zA-Z0-9_-]+$/.test(e))throw Error(`Invalid table name: ${e}. Table names can only contain letters, numbers, dashes and underscores.`)}parseWindow(e){if("number"==typeof e){if(e<=0)throw Error(`Invalid window: ${e}`);return e}let t=/^(\d+)([smhd])$/;if(!t.test(e))throw Error(`Invalid window: ${e}`);let[,i,r]=e.match(t),n=parseInt(i);switch(r){case"s":return 1e3*n;case"m":return 1e3*n*60;case"h":return 1e3*n*3600;case"d":return 1e3*n*86400;default:throw Error(`Invalid window unit: ${r}`)}}getBucket(e){return Math.floor((e??Date.now())/this.bucketSize)*this.bucketSize}async ingest(e,...t){this.validateTableName(e),await Promise.all(t.map(async t=>{let i=this.getBucket(t.time),r=[this.prefix,e,i].join(":");await this.redis.zincrby(r,1,JSON.stringify({...t,time:void 0}))}))}formatBucketAggregate(e,t,i){let r={};return e.forEach(([e,i])=>{"success"==t&&(e=1===e?"true":null===e?"false":e),r[t]=r[t]||{},r[t][(e??"null").toString()]=i}),{time:i,...r}}async aggregateBucket(e,t,i){this.validateTableName(e);let r=this.getBucket(i),n=[this.prefix,e,r].join(":"),s=await this.redis.eval(a,[n],[t]);return this.formatBucketAggregate(s,t,r)}async aggregateBuckets(e,t,i,r){this.validateTableName(e);let n=this.getBucket(r),s=[];for(let r=0;r<i;r+=1)s.push(this.aggregateBucket(e,t,n)),n-=this.bucketSize;return Promise.all(s)}async aggregateBucketsWithPipeline(e,t,i,r,n){this.validateTableName(e),n=n??48;let s=this.getBucket(r),o=[],l=this.redis.pipeline(),c=[];for(let r=1;r<=i;r+=1){let u=[this.prefix,e,s].join(":");l.eval(a,[u],[t]),o.push(s),s-=this.bucketSize,(r%n==0||r==i)&&(c.push(l.exec()),l=this.redis.pipeline())}return(await Promise.all(c)).flat().map((e,i)=>this.formatBucketAggregate(e,t,o[i]))}async getAllowedBlocked(e,t,i){this.validateTableName(e);let r=[this.prefix,e].join(":"),n=this.getBucket(i),s=await this.redis.eval(l,[r],[n,this.bucketSize,t]),a={};for(let e=0;e<s.length;e+=2){let t=s[e],i=t.identifier,r=+s[e+1];a[i]||(a[i]={success:0,blocked:0}),a[i][t.success?"success":"blocked"]=r}return a}async getMostAllowedBlocked(e,t,i,r,n){this.validateTableName(e);let s=[this.prefix,e].join(":"),a=this.getBucket(r),[l,c,u]=await this.redis.eval(o,[s],[a,this.bucketSize,t,i,n??5*i]);return{allowed:this.toDicts(l),ratelimited:this.toDicts(c),denied:this.toDicts(u)}}toDicts(e){let t=[];for(let i=0;i<e.length;i+=1){let r=+e[i][0],n=e[i][1];t.push({identifier:n.identifier,count:r})}return t}}}};var t=require("../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),r=t.X(0,[4243,2822,580,2289,2846],()=>i(83503));module.exports=r})();