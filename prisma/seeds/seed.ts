import { adminSeed } from './admin';

// Add seeders in sequence to avoid foreign key constraint errors
const seed = async () => {
  await adminSeed();
};

(async () => {
  try {
    await seed();
    console.log('Seed successfully completed.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed: ', error);
    process.exit(1);
  }
})();
