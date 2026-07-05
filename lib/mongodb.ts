import mongoose from 'mongoose';
import dns from 'dns';

// Force Google DNS resolvers to resolve MongoDB SRV and TXT records globally in Node
const dnsResolver = new dns.Resolver();
try {
  dnsResolver.setServers(['8.8.8.8', '8.8.4.4']);
  
  const originalResolveSrv = dns.resolveSrv;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dns as any).resolveSrv = function(hostname: string, callback: any) {
    dnsResolver.resolveSrv(hostname, (err, addresses) => {
      if (err) {
        originalResolveSrv.call(dns, hostname, callback);
      } else {
        callback(null, addresses);
      }
    });
  };

  const originalResolveTxt = dns.resolveTxt;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (dns as any).resolveTxt = function(hostname: string, callback: any) {
    dnsResolver.resolveTxt(hostname, (err, addresses) => {
      if (err) {
        originalResolveTxt.call(dns, hostname, callback);
      } else {
        callback(null, addresses);
      }
    });
  };
} catch (err) {
  console.warn('Failed to configure Google DNS fallback resolver:', err);
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
  var useLocalDB: boolean | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

const activeCache = cached!;

async function dbConnect() {
  if (global.useLocalDB) {
    return null;
  }

  if (activeCache.conn) {
    return activeCache.conn;
  }

  if (!activeCache.promise) {
    const resolver = new dns.Resolver();
    try {
      resolver.setServers(['8.8.8.8', '8.8.4.4']);
    } catch (e) {
      console.warn('Could not set custom DNS servers on resolver:', e);
    }

    const opts = {
      bufferCommands: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lookup: (hostname: string, options: any, callback: any) => {
        resolver.resolve4(hostname, (err, addresses) => {
          if (err || addresses.length === 0) {
            dns.lookup(hostname, options, callback);
          } else {
            callback(null, addresses[0], 4);
          }
        });
      }
    };

    activeCache.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      return m;
    });
  }

  try {
    activeCache.conn = await activeCache.promise;
    global.useLocalDB = false;
  } catch (e) {
    activeCache.promise = null;
    console.warn('MongoDB connection failed. Switching to Local JSON DB fallback.', e);
    global.useLocalDB = true;
    return null;
  }

  return activeCache.conn;
}

export default dbConnect;
