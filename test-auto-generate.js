// Test script for auto-generation of schedules feature
// Run with: node test-auto-generate.js

async function testAutoGenerate() {
  try {
    console.log('🧪 Testing Auto-Generation Feature...\n');
    
    // Step 0: Login as admin to get authentication cookie
    console.log('🔐 Step 0: Authenticating as admin...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@cloudticket.com',
        password: 'admin123'
      })
    });
    
    if (!loginRes.ok) {
      const loginError = await loginRes.json();
      console.error('❌ Login failed:', loginError.error || 'Unknown error');
      process.exit(1);
    }
    
    // Extract cookies from response
    const setCookieHeader = loginRes.headers.get('set-cookie');
    const cookies = setCookieHeader ? setCookieHeader.split(', ') : [];
    const cookieString = cookies.join('; ');
    
    console.log('✅ Authenticated successfully\n');
    
    // Step 1: Get routes
    console.log('📋 Step 1: Fetching available routes...');
    const routesRes = await fetch('http://localhost:3000/api/admin/routes', {
      headers: {
        'Cookie': cookieString
      }
    });
    const routesData = await routesRes.json();
    
    if (!routesData.routes || routesData.routes.length === 0) {
      console.error('❌ No routes found. Please create routes first.');
      process.exit(1);
    }
    
    // Find Mumbai to Pune route or use first route
    const testRoute = routesData.routes.find(r => 
      r.from_city === 'Mumbai' && r.to_city === 'Pune'
    ) || routesData.routes[0];
    
    console.log(`✅ Found route: ${testRoute.from_city} → ${testRoute.to_city} (ID: ${testRoute.id})`);
    console.log(`   Departure: ${testRoute.departure_time}, Arrival: ${testRoute.arrival_time}`);
    console.log(`   Base Price: ₹${testRoute.base_price}\n`);
    
    // Step 2: Calculate date range (tomorrow to 7 days later)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endDate = new Date(tomorrow);
    endDate.setDate(endDate.getDate() + 7);
    
    const startDateStr = tomorrow.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log('📅 Step 2: Date range for recurring schedule:');
    console.log(`   Start: ${startDateStr}`);
    console.log(`   End: ${endDateStr}`);
    console.log(`   Expected schedules: 8 (daily for 8 days)\n`);
    
    // Step 3: Count existing schedules for this route in date range
    console.log('🔍 Step 3: Checking existing schedules...');
    const schedulesRes = await fetch('http://localhost:3000/api/admin/schedules', {
      headers: {
        'Cookie': cookieString
      }
    });
    const schedulesData = await schedulesRes.json();
    
    const existingSchedules = schedulesData.schedules?.filter(s => {
      if (s.route_id !== testRoute.id) return false;
      const scheduleDate = new Date(s.travel_date);
      return scheduleDate >= tomorrow && scheduleDate <= endDate;
    }) || [];
    
    console.log(`   Existing schedules in range: ${existingSchedules.length}\n`);
    
    // Step 4: Create recurring schedule
    console.log('🚀 Step 4: Creating recurring schedule (this should auto-generate schedules)...');
    const recurringScheduleData = {
      routeId: testRoute.id,
      recurrenceType: 'daily',
      recurrenceDays: null,
      startDate: startDateStr,
      endDate: endDateStr,
      departureTime: testRoute.departure_time || '08:00',
      arrivalTime: testRoute.arrival_time || '11:00',
      priceOverride: null,
      seatCapacityOverride: null,
      status: 'active'
    };
    
    const createRes = await fetch('http://localhost:3000/api/admin/recurring-schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify(recurringScheduleData)
    });
    
    const createResult = await createRes.json();
    
    if (!createRes.ok) {
      console.error('❌ Failed to create recurring schedule:');
      console.error(`   Status: ${createRes.status}`);
      console.error(`   Error: ${createResult.error || JSON.stringify(createResult)}`);
      process.exit(1);
    }
    
    console.log('✅ Recurring schedule created successfully!');
    console.log(`   Recurring Schedule ID: ${createResult.schedule?.id}`);
    console.log(`   Schedules Generated: ${createResult.schedulesGenerated || 0}`);
    console.log(`   Message: ${createResult.message || 'N/A'}\n`);
    
    // Step 5: Verify schedules were created
    console.log('✅ Step 5: Verifying generated schedules...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for processing
    
    const verifySchedulesRes = await fetch('http://localhost:3000/api/admin/schedules', {
      headers: {
        'Cookie': cookieString
      }
    });
    const verifySchedulesData = await verifySchedulesRes.json();
    
    const newSchedules = verifySchedulesData.schedules?.filter(s => {
      if (s.route_id !== testRoute.id) return false;
      const scheduleDate = new Date(s.travel_date);
      return scheduleDate >= tomorrow && scheduleDate <= endDate;
    }) || [];
    
    console.log(`   Total schedules in range now: ${newSchedules.length}`);
    console.log(`   New schedules created: ${newSchedules.length - existingSchedules.length}`);
    
    if (newSchedules.length > existingSchedules.length) {
      console.log('\n🎉 SUCCESS! Auto-generation is working!');
      console.log(`   ${newSchedules.length - existingSchedules.length} schedules were automatically generated.`);
      console.log('\n📋 Generated schedules:');
      newSchedules.slice(existingSchedules.length).forEach(s => {
        console.log(`   - ${s.travel_date}: ${s.available_seats} seats available`);
      });
    } else {
      console.log('\n⚠️  WARNING: No new schedules detected.');
      console.log('   This could mean:');
      console.log('   1. Schedules already existed for these dates');
      console.log('   2. Auto-generation failed (check server logs)');
      console.log('   3. Date range had no matching days');
    }
    
    console.log('\n✨ Test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testAutoGenerate();
