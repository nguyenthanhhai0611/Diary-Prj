// image.js - helper functions for Supabase Storage operations (upload, signed url, remove)
export function getStorageBucket(){
  try{ return window.SUPABASE_BUCKET || 'Diary'; }catch(e){ return 'Diary'; }
}

export async function uploadImage(s, file, userId){
  if(!s || !s.storage) throw new Error('Supabase storage client not available');
  const safeName = (file && file.name) ? file.name.replace(/[^a-zA-Z0-9._-]/g,'_') : ('file_' + Date.now());
  const fileName = `${userId || 'anon'}_${Date.now()}_${safeName}`;
  const bucket = getStorageBucket();
  const res = await s.storage.from(bucket).upload(fileName, file);
  return { bucket, fileName, res };
}

export async function createSignedUrl(s, path, expires = 3600){
  if(!s || !s.storage) throw new Error('Supabase storage client not available');
  const bucket = getStorageBucket();
  const out = await s.storage.from(bucket).createSignedUrl(path, expires);
  // normalize url if possible
  const url = out?.data?.signedUrl || out?.data?.signedURL || out?.signedUrl || out?.signedURL || null;
  return { bucket, out, url };
}

export async function removeObject(s, path){
  if(!s || !s.storage) throw new Error('Supabase storage client not available');
  const bucket = getStorageBucket();
  const out = await s.storage.from(bucket).remove([path]);
  return { bucket, out };
}

export default {
  getStorageBucket,
  uploadImage,
  createSignedUrl,
  removeObject,
};
