import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wioofhgpmkxmwhniprlf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpb29maGdwbWt4d3dobmlwcmxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMjEyOTcsImV4cCI6MjA5OTU5NzI5N30.hgQAQ88KzvbwEyelLAwgTPd66orP2ZZsRol7_G3BXR8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking live_games table...");
  const { data, error } = await supabase.from('live_games').select('*').limit(1);
  if (error) {
    console.error("Error reading live_games:", error.message);
  } else {
    console.log("Success! Table exists. Data:", data);
  }
}

check();
