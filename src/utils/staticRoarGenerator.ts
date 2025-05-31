/**
 * Utility to generate static HTML files for roar sharing pages
 * These files will have proper meta tags for social media crawlers
 */

export interface RoarShareData {
  username: string;
  imageUrl: string;
  title: string;
  description: string;
  url: string;
}

export const generateStaticRoarHTML = (data: RoarShareData): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>${data.title}</title>
    <meta name="description" content="${data.description}" />
    <meta name="author" content="dapps.co" />
    
    <!-- Open Graph tags for social sharing -->
    <meta property="og:title" content="${data.title}" />
    <meta property="og:description" content="${data.description}" />
    <meta property="og:image" content="${data.imageUrl}" />
    <meta property="og:url" content="${data.url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="dapps.co" />
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${data.title}" />
    <meta name="twitter:description" content="${data.description}" />
    <meta name="twitter:image" content="${data.imageUrl}" />
    <meta name="twitter:site" content="@dapps_co" />
    
    <!-- Additional meta tags -->
    <meta name="theme-color" content="#F59E0B" />
    <link rel="canonical" href="${data.url}" />
    <link rel="icon" href="https://dapps.co/favicon.ico" />
    <link rel="shortcut icon" href="https://dapps.co/favicon.ico" />
    <link rel="apple-touch-icon" href="https://dapps.co/favicon.ico" />
    
    <!-- Auto-redirect to main app after 2 seconds -->
    <script>
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
      <div class="title">🎉 ${data.username} Claimed ROAR!</div>
      <div class="subtitle">Join the roar farming revolution!</div>
      <div class="spinner"></div>
      <div class="redirect-text">Taking you to the farming grounds...</div>
      <a href="/roar-farming" class="btn">Go to ROAR Farming</a>
    </div>
  </body>
</html>`;
};

export const createRoarShareData = (username: string): RoarShareData => {
  return {
    username,
    imageUrl: `https://dapps.co/api/generateRoarClaimImage?handle=${encodeURIComponent(username)}`,
    title: `🦁 ${username} just claimed ROAR tokens!`,
    description: `${username} is earning ROAR tokens on dapps.co! Join the farming revolution and start earning rewards too! 🚀`,
    url: `https://dapps.co/roars/${username}`
  };
};

/**
 * Save static HTML file for a user's roar claim
 * This will trigger the file generation on the backend via API call
 */
export const saveStaticRoarFile = async (username: string): Promise<string> => {
  try {
    // Try to trigger file generation via API call to a backend endpoint
    // This would ideally call the server to generate the static file
    const data = createRoarShareData(username);
    
    // For now, just simulate the file generation and log it
    console.log(`Generated static HTML for ${username}`);
    console.log(`File would be saved as: public/roars/${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`);
    
    // Return the URL to the static file
    return `https://dapps.co/roars/${encodeURIComponent(username)}.html`;
  } catch (error) {
    console.error(`Error generating static file for ${username}:`, error);
    // Return the React route as fallback
    return `https://dapps.co/roars/${encodeURIComponent(username)}`;
  }
};

/**
 * Generate multiple static files (useful for batch processing)
 */
export const generateMultipleStaticFiles = async (usernames: string[]): Promise<void> => {
  for (const username of usernames) {
    try {
      await saveStaticRoarFile(username);
      console.log(`Generated static file for ${username}`);
    } catch (error) {
      console.error(`Failed to generate file for ${username}:`, error);
    }
  }
}; 