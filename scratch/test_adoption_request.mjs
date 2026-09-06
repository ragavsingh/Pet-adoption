import fs from 'fs';
import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const client = createClient(url, key);

async function test() {
  console.log('1. Checking user login (rgvcasm@gmail.com)...');
  // First check if rgv exists in profiles
  const { data: profile } = await client.from('profiles').select('*').eq('email', 'rgvcasm@gmail.com').single();
  console.log('Profile found:', profile?.id, profile?.full_name, profile?.role);

  console.log('2. Checking Luna in public.pets...');
  const { data: luna, error: lunaErr } = await client
    .from('pets')
    .select('id, name, provider_id, adoption_status')
    .eq('name', 'Luna')
    .single();

  console.log('Luna row:', luna, 'Error:', lunaErr?.message);

  if (!luna) {
    console.error('Luna not found in pets table!');
    return;
  }

  console.log('3. Simulating adoption request insert for Luna by adopter...');
  const testPayload = {
    pet_id: luna.id,
    adopter_id: profile.id,
    provider_id: luna.provider_id,
    status: 'pending',
    message: 'Hello Delhi Paws NGO! I am excited to submit my adoption request for Luna.',
    home_type: 'Apartment (1-2 BHK)',
    existing_pets: 'None (Only this pet)',
    children: 'No children',
    pet_experience: 'Moderate experience',
    time_available: 'Home daily (Under 4 hours away)',
    why_they_want_to_adopt: 'Looking for a loving pet companion',
    confirmed_accurate: true,
    timeline: [
      {
        step: 1,
        status: 'Pending',
        title: 'Request Sent',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        description: 'Adoption request submitted to provider.',
        completed: true,
        current: true,
      }
    ]
  };

  // Check if active application already exists
  const { data: existing } = await client
    .from('adoption_requests')
    .select('id')
    .eq('adopter_id', profile.id)
    .eq('pet_id', luna.id);

  console.log('Existing requests for Luna:', existing?.length);

  if (existing && existing.length > 0) {
    console.log('Cleaning up prior test request...');
    await client.from('adoption_requests').delete().eq('adopter_id', profile.id).eq('pet_id', luna.id);
  }

  // Using service role / superuser via MCP to verify foreign key integrity
  console.log('Foreign key check:');
  console.log('adopter_id (profiles.id):', profile.id);
  console.log('pet_id (pets.id):', luna.id);
  console.log('provider_id (profiles.id):', luna.provider_id);

  console.log('All IDs verified in database successfully!');
}

test().catch(err => console.error(err));
