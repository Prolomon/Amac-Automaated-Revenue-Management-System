import { prisma } from './config/db.js';
const t = setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 25000);
try {
  const pricing = await prisma.pricing.findMany({ select: { code: true, center: true, type: true, category: true } });
  const companies = await prisma.company.findMany({ select: { uid: true, name: true, center: true } });
  const pricCenters = [...new Set(pricing.map(p => p.center).filter(Boolean))];
  const coUids = companies.map(c => c.uid);
  const coCenters = [...new Set(companies.map(c => c.center).filter(Boolean))];
  console.log('pricing count:', pricing.length);
  console.log('pricing.center distinct (first 20):', JSON.stringify(pricCenters.slice(0,20)));
  console.log('pricing sample (first 5):', JSON.stringify(pricing.slice(0,5)));
  console.log('company count:', companies.length);
  console.log('company.center distinct (first 20):', JSON.stringify(coCenters.slice(0,20)));
  console.log('company sample (first 5):', JSON.stringify(companies.slice(0,5)));
  console.log('pricing.center values that match a company.uid:', JSON.stringify(pricCenters.filter(c => coUids.includes(c)).slice(0,20)));
  console.log('count of pricing rows whose center matches a company.uid:', pricing.filter(p => coUids.includes(p.center)).length, 'of', pricing.length);
} catch (e) { console.error('ERR', e.message); }
finally { clearTimeout(t); await prisma.$disconnect(); process.exit(0); }
