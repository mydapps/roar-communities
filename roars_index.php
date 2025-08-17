<?php
// Get username from URL parameter
$username = isset($_GET['u']) ? htmlspecialchars($_GET['u'], ENT_QUOTES, 'UTF-8') : 'Unknown';

// Generate dynamic meta content
$ogTitle = "🦁 " . $username . " just claimed ROAR tokens!";
$ogDescription = $username . " is earning ROAR tokens on dapps.co! Join the farming revolution and start earning rewards too! 🚀";
$ogImage = "https://dapps.co/api/generateRoarClaimImage?handle=" . urlencode($username);
$ogUrl = "https://dapps.co/roars/?u=" . urlencode($username);

// Redirect URL to the React app
$redirectUrl = "https://dapps.co/roar-farming";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Basic Meta Tags -->
    <title><?php echo htmlspecialchars($ogTitle); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($ogDescription); ?>">
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="<?php echo htmlspecialchars($ogTitle); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($ogDescription); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($ogImage); ?>">
    <meta property="og:url" content="<?php echo htmlspecialchars($ogUrl); ?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="dapps.co">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/png">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($ogTitle); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($ogDescription); ?>">
    <meta name="twitter:image" content="<?php echo htmlspecialchars($ogImage); ?>">
    <meta name="twitter:site" content="@dapps_co">
    <meta name="twitter:creator" content="@dapps_co">
    
    <!-- Additional Meta Tags -->
    <meta name="theme-color" content="#F59E0B">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="<?php echo htmlspecialchars($ogUrl); ?>">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="https://dapps.co/favicon.ico">
    
    <!-- Auto-redirect with session storage for React app -->
    <script>
        // Store the referrer context for the farming page
        sessionStorage.setItem('roar_share_referrer', '<?php echo addslashes($username); ?>');
        
        // Auto-redirect after 2 seconds
        setTimeout(function() {
            window.location.href = '<?php echo $redirectUrl; ?>';
        }, 2000);
    </script>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #FEF3C7 0%, #F59E0B 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #92400E;
        }
        
        .container {
            text-align: center;
            max-width: 500px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .lion {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-20px); }
            60% { transform: translateY(-10px); }
        }
        
        .title {
            font-size: 1.8rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #92400E;
        }
        
        .subtitle {
            font-size: 1rem;
            margin-bottom: 1.5rem;
            color: #B45309;
        }
        
        .loader {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #F3F4F6;
            border-radius: 50%;
            border-top-color: #F59E0B;
            animation: spin 1s ease-in-out infinite;
            margin-right: 0.5rem;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .status {
            font-size: 0.9rem;
            color: #D97706;
            margin-top: 1rem;
        }
        
        .cta-button {
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 1rem;
            transition: transform 0.2s ease;
        }
        
        .cta-button:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="lion">🦁</div>
        <h1 class="title">🎉 <?php echo htmlspecialchars($username); ?> Claimed ROAR!</h1>
        <p class="subtitle">Join the roar farming revolution!</p>
        
        <div class="status">
            <div class="loader"></div>
            Taking you to the farming grounds...
        </div>
        
        <a href="<?php echo $redirectUrl; ?>" class="cta-button">
            🚀 Start Farming ROAR Now!
        </a>
        
        <script>
            // Backup redirect if auto-redirect fails
            document.querySelector('.cta-button').addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = '<?php echo $redirectUrl; ?>';
            });
        </script>
    </div>
</body>
</html> 