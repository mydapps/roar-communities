#!/usr/bin/env node

/**
 * Script to generate static HTML files for roar sharing
 * Usage: node scripts/generateRoarFiles.js [username1] [username2] ...
 */

const fs = require('fs');
const path = require('path');

// Ensure roars directory exists
const roarsDir = path.join(__dirname, '../public/roars');
if (!fs.existsSync(roarsDir)) {
  fs.mkdirSync(roarsDir, { recursive: true });
}

function sanitizeUsername(username) {
  return username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

function generateStaticRoarHTML(username) {
  const title = `🦁 ${username} just claimed ROAR tokens!`;
  const description = `${username} is earning ROAR tokens on dapps.co! Join the farming revolution and start earning rewards too! 🚀`;
  const imageUrl = `https://dapps.co/api/generateRoarClaimImage?handle=${encodeURIComponent(username)}`;
  const url = `https://dapps.co/roars/${username}.html`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="dapps.co" />
    
    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="dapps.co" />
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:site" content="@dapps_co" />
    
    <!-- Additional meta tags -->
    <meta name="theme-color" content="#F59E0B" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" href="https://dapps.co/favicon.ico" />
    <link rel="shortcut icon" href="https://dapps.co/favicon.ico" />
    <link rel="apple-touch-icon" href="https://dapps.co/favicon.ico" />
    
    <!-- Auto-redirect to main app after 2 seconds -->
    <script>
      // Store referrer context for farming page
      sessionStorage.setItem('roar_share_referrer', '${username}');
      
      setTimeout(function() {
        window.location.href = '/roar-farming';
      }, 2000);
    </script>
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        background: linear-gradient(135deg, #FEF3C7 0%, #F59E0B 100%);
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        color: #92400E;
      }
      .container {
        text-align: center;
        background: rgba(255, 255, 255, 0.9);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        max-width: 400px;
        margin: 20px;
      }
      .lion {
        font-size: 80px;
        margin-bottom: 20px;
        animation: bounce 2s infinite;
      }
      .title {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #92400E;
      }
      .subtitle {
        font-size: 18px;
        margin-bottom: 20px;
        color: #D97706;
      }
      .redirect-text {
        font-size: 14px;
        color: #92400E;
        opacity: 0.8;
      }
      .btn {
        background: linear-gradient(135deg, #F59E0B, #D97706);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        margin-top: 20px;
        transition: transform 0.2s;
      }
      .btn:hover {
        transform: scale(1.05);
      }
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
        60% {
          transform: translateY(-5px);
        }
      }
      .spinner {
        border: 4px solid #FEF3C7;
        border-top: 4px solid #F59E0B;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="lion">🦁</div>
      <div class="title">🎉 ${username} Claimed ROAR!</div>
      <div class="subtitle">Join the roar farming revolution!</div>
      <div class="spinner"></div>
      <div class="redirect-text">Taking you to the farming grounds...</div>
      <a href="/roar-farming" class="btn">Go to ROAR Farming</a>
    </div>
  </body>
</html>`;
}

function generateRoarFile(username) {
  const sanitized = sanitizeUsername(username);
  const filename = `${sanitized}.html`;
  const filepath = path.join(roarsDir, filename);
  const html = generateStaticRoarHTML(username);
  
  fs.writeFileSync(filepath, html, 'utf8');
  console.log(`✅ Generated: ${filepath}`);
  return filepath;
}

// Main execution
if (require.main === module) {
  const usernames = process.argv.slice(2);
  
  if (usernames.length === 0) {
    console.log('Usage: node scripts/generateRoarFiles.js [username1] [username2] ...');
    console.log('Example: node scripts/generateRoarFiles.js "TestUser" "AnotherUser"');
    process.exit(1);
  }
  
  console.log(`Generating static HTML files for ${usernames.length} users...`);
  
  usernames.forEach(username => {
    try {
      generateRoarFile(username);
    } catch (error) {
      console.error(`❌ Failed to generate file for ${username}:`, error.message);
    }
  });
  
  console.log('\n✨ Generation complete!');
  console.log(`Files saved to: ${roarsDir}`);
}

module.exports = { generateRoarFile, generateStaticRoarHTML }; 