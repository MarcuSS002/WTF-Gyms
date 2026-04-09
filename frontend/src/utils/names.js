const FIRST = [
  'Aarav','Liam','Noah','Oliver','Elijah','Emma','Olivia','Ava','Sophia','Isabella',
  'Mia','Amelia','Lucas','Mason','Ethan','James','Henry','Benjamin','Charlotte','Harper'
];

const LAST = [
  'Patel','Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez',
  'Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson'
];

function hashString(s){
  let h = 2166136261 >>> 0;
  for (let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    h = h >>> 0;
  }
  return h;
}

export function getMemberName(id){
  if (!id && id !== 0) return 'Guest';
  const key = String(id);
  const h = hashString(key);
  const first = FIRST[h % FIRST.length];
  const last = LAST[(h >>> 8) % LAST.length];
  return `${first} ${last}`;
}

export default getMemberName;
