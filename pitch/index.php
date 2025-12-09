<?php
session_start();

// API Configuration
$apiUrl = 'https://email.oropocket.com/api/batch_mail/api/send';
$apiKey = '579d76a39c29a4fca0c7e08a9f388e69ced29b8786ca0bad112d6a9a4f79b3f4';

// Handle Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'])) {
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $_SESSION['viewer_email'] = $email;
        
        // Function to send notification
        function sendNotification($recipient, $viewerEmail, $apiUrl, $apiKey) {
            $data = [
                'recipient' => $recipient,
                'attribs' => [
                    'viewer_email' => $viewerEmail
                ]
            ];
            
            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'X-API-Key: ' . $apiKey,
                'Content-Type: application/json'
            ]);
            
            // Disable SSL verification for development/testing if needed (remove in strict prod)
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
            
            $response = curl_exec($ch);
            curl_close($ch);
            return $response;
        }

        // Send notifications to founders
        sendNotification('m@dapps.co', $email, $apiUrl, $apiKey);
        sendNotification('t@dapps.co', $email, $apiUrl, $apiKey);
        
        // Redirect to self to clear POST data
        header("Location: " . $_SERVER['PHP_SELF']);
        exit;
    } else {
        $error = "Please enter a valid email address.";
    }
}

$isAuthorized = isset($_SESSION['viewer_email']);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>dapps.co - seed deck</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        dark: '#050505',
                        light: '#f3f4f6',
                    }
                }
            }
        }
    </script>
    <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap"
        rel="stylesheet">
    <style>
        :root {
            --bg-color: #050505;
            --primary: #ffffff;
            --accent: #6366f1;
            --text-main: #ffffff;
            --text-muted: #9ca3af;
        }

        :root.light {
            --bg-color: #f3f4f6;
            --primary: #111827;
            --accent: #4f46e5;
            --text-main: #111827;
            --text-muted: #4b5563;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            overflow: hidden;
            transition: background-color 0.5s ease, color 0.5s ease;
        }

        .font-serif {
            font-family: 'Playfair Display', serif;
        }

        /* Cinematic Slide Transitions */
        .slide {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            visibility: hidden;
            transition: all 1s cubic-bezier(0.645, 0.045, 0.355, 1);
            transform: scale(1.1);
            z-index: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }

        /* Scaled Desktop Wrapper */
        #deck-wrapper {
            width: 1280px;
            height: 720px;
            position: absolute;
            top: 0;
            left: 0;
            transform-origin: top left;
            overflow: hidden;
            background-color: var(--bg-color);
            box-shadow: 0 0 50px rgba(0,0,0,0.5);
        }

        .slide.active {
            opacity: 1;
            visibility: visible;
            transform: scale(1);
            z-index: 10;
        }



        .slide.prev {
            transform: translateY(-100%);
            opacity: 0;
            visibility: visible;
            z-index: 5;
        }



        /* Background Effects */
        .noise {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 50;
            opacity: 0.03;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E");
        }
        
        :root.light .noise {
            opacity: 0.05;
            filter: invert(1);
        }

        .spotlight {
            position: absolute;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, rgba(0, 0, 0, 0) 60%);
            pointer-events: none;
        }

        :root.light .spotlight {
            background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, rgba(255, 255, 255, 0) 60%);
        }

        /* Typography & Text Effects */
        .hero-text {
            font-size: clamp(2rem, 6vw, 8rem); /* Reduced min size for mobile */
            line-height: 0.9;
            letter-spacing: -0.04em;
            font-weight: 800;
            background: linear-gradient(to bottom, #fff 0%, #aaa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        :root.light .hero-text {
            background: linear-gradient(to bottom, #111827 0%, #4b5563 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .reveal-text {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.8s ease-out;
        }

        .slide.active .reveal-text {
            opacity: 1;
            transform: translateY(0);
        }

        .delay-100 {
            transition-delay: 100ms;
        }

        .delay-200 {
            transition-delay: 200ms;
        }

        .delay-300 {
            transition-delay: 300ms;
        }

        .delay-500 {
            transition-delay: 500ms;
        }

        /* Custom Components */
        .stat-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 1rem;
            transition: transform 0.3s ease;
        }

        /* Typography & Text Effects */
        .hero-text {
            font-size: 8rem; /* Fixed large size */
            line-height: 0.9;
            letter-spacing: -0.04em;
            font-weight: 800;
            background: linear-gradient(to bottom, #fff 0%, #aaa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        :root.light .hero-text {
            background: linear-gradient(to bottom, #111827 0%, #4b5563 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .stat-card:hover {
            transform: translateY(-5px);
            border-color: rgba(99, 102, 241, 0.3);
        }

        .glass-card {
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        :root.light .stat-card {
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        :root.light .glass-card {
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .logo-glow {
            filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
            animation: pulse-logo 4s infinite ease-in-out;
        }

        @keyframes pulse-logo {

            0%,
            100% {
                filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));
            }

            50% {
                filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.6));
            }
        }

        /* Progress Bar */
        .progress-container {
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 0.5rem;
            z-index: 100;
        }

        .progress-dot {
            width: 40px;
            height: 2px;
            background: rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }
        
        :root.light .progress-dot {
            background: rgba(0, 0, 0, 0.2);
        }

        .progress-dot.active {
            background: #fff;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        :root.light .progress-dot.active {
            background: #4f46e5;
            box-shadow: 0 0 10px rgba(79, 70, 229, 0.3);
        }

        /* Email Gate Overlay */
        .email-gate {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(5, 5, 5, 0.95);
            backdrop-filter: blur(20px);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    </style>
</head>

<body class="dark">

    <!-- Theme Toggle -->
    <button id="theme-toggle" class="fixed top-8 right-8 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 backdrop-blur-md transition-all duration-300 group">
        <!-- Sun Icon (for dark mode) -->
        <svg class="w-6 h-6 text-yellow-300 hidden dark:block group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
        <!-- Moon Icon (for light mode) -->
        <svg class="w-6 h-6 text-indigo-600 block dark:hidden group-hover:-rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
        </svg>
    </button>

    <div class="noise"></div>

    <?php if (!$isAuthorized): ?>
    <!-- Email Gate Overlay -->
    <div class="email-gate">
        <div class="glass-card p-8 md:p-12 max-w-md w-full text-center border-indigo-500/30 shadow-[0_0_100px_rgba(99,102,241,0.2)] mx-4">
            <div class="mb-8">
                <img src="dapps.png" alt="dapps.co" class="w-24 h-24 object-contain mx-auto mb-6 logo-glow">
                <h2 class="text-3xl font-bold font-serif mb-2 text-gray-900 dark:text-white">Dapps Deck</h2>
                <p class="text-gray-600 dark:text-gray-400">Please enter your email to view this presentation.</p>
            </div>
            
            <form method="POST" action="" class="space-y-6">
                <div>
                    <input type="email" name="email" required placeholder="name@company.com" 
                        class="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all">
                </div>
                
                <?php if (isset($error)): ?>
                    <p class="text-red-400 text-sm"><?php echo $error; ?></p>
                <?php endif; ?>

                <button type="submit" 
                    class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-500/25">
                    View Presentation
                </button>
            </form>
            
            <p class="mt-8 text-xs text-gray-600 uppercase tracking-widest">Confidential & Proprietary</p>
        </div>
    </div>
    <?php else: ?>
    
    <div id="deck-wrapper">

    <!-- Navigation Overlay -->
    <div class="fixed top-8 left-8 z-50 mix-blend-difference text-white">
        <span class="font-bold tracking-widest text-xs uppercase opacity-50">dapps.co // Seed Deck</span>
    </div>

    <!-- Slide 1: The Hook -->
    <section class="slide active" id="slide-1">
        <div class="spotlight"></div>
        <div class="text-center z-10 max-w-5xl px-4">
            <h1 class="hero-text mb-8 reveal-text">The internet was built<br>for connection.</h1>
            <p class="text-3xl text-gray-600 dark:text-gray-400 font-light reveal-text delay-200">
                Somewhere along the way, we became the product.
            </p>
        </div>
    </section>

    <!-- Slide 2: The Villain -->
    <section class="slide" id="slide-2">
        <div class="absolute inset-0 bg-red-900/5 z-0"></div>
        <div class="max-w-6xl w-full z-10 grid grid-cols-2 gap-16 items-center px-8">
            <div>
                <h2 class="text-6xl font-bold mb-8 font-serif reveal-text">The <span
                        class="text-red-500">Extraction</span> Economy</h2>
                <div class="space-y-8">
                    <div class="reveal-text delay-100 border-l-2 border-red-500 pl-6">
                        <h3 class="text-2xl font-bold mb-1 text-gray-900 dark:text-white">100% Take Rate</h3>
                        <p class="text-gray-600 dark:text-gray-400">You create the value. They keep the profit.</p>
                    </div>
                    <div class="reveal-text delay-200 border-l-2 border-red-500 pl-6">
                        <h3 class="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Zero Ownership</h3>
                        <p class="text-gray-600 dark:text-gray-400">One algorithm change can wipe out your existence.</p>
                    </div>
                    <div class="reveal-text delay-300 border-l-2 border-red-500 pl-6">
                        <h3 class="text-2xl font-bold mb-1 text-gray-900 dark:text-white">The "Slop" Crisis</h3>
                        <p class="text-gray-600 dark:text-gray-400">Bots are drowning out human connection.</p>
                    </div>
                </div>
            </div>
            <div class="relative reveal-text delay-500">
                <!-- Glitch Effect Visual -->
                <div class="glass-card p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div class="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <div class="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                        <div class="h-8 w-8 bg-gray-700 rounded-full"></div>
                    </div>
                    <div class="space-y-4">
                <div class="glass-card p-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div class="flex items-center justify-between mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                        <div class="h-4 bg-gray-700 rounded w-3/4"></div>
                        <div class="h-4 bg-gray-700 rounded w-1/2"></div>
                    </div>
                </div>
                <div class="absolute -top-10 -right-10 glass-card p-4 -rotate-6 z-[-1] opacity-50">
                    <div class="text-red-500 font-mono text-sm">ERROR: USER_NOT_FOUND</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Slide 3: The Shift -->
    <section class="slide" id="slide-3">
        <div class="text-center z-10">
            <h2 class="text-sm font-bold tracking-[0.5em] text-indigo-400 mb-12 uppercase reveal-text">The Paradigm
                Shift</h2>
            <div class="flex flex-row items-center gap-12 reveal-text delay-200">
                <div class="text-right opacity-40">
                    <h3 class="text-5xl font-bold font-serif text-gray-900 dark:text-white">Creator</h3>
                    <p class="text-sm uppercase tracking-widest mt-2 text-gray-600 dark:text-gray-400">One-to-Many</p>
                </div>
                <div class="w-24 h-1 bg-gradient-to-r from-gray-800 to-indigo-500"></div>
                <div class="text-left">
                    <h3 class="text-7xl font-bold font-serif text-gray-900 dark:text-white">Community</h3>
                    <p class="text-sm uppercase tracking-widest mt-2 text-indigo-600 dark:text-indigo-400">Many-to-Many</p>
                </div>
            </div>
            <p class="mt-16 text-2xl text-gray-600 dark:text-gray-400 italic reveal-text delay-300">
                "It's no longer about following. It's about <span
                    class="text-gray-900 dark:text-white border-b border-indigo-500">belonging</span>."
            </p>
        </div>
    </section>

    <!-- Slide 4: The Solution -->
    <section class="slide" id="slide-4">
        <div class="spotlight"
            style="background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.2) 0%, rgba(0, 0, 0, 0) 70%);">
        </div>
        <div class="z-10 text-center flex flex-col items-center">
            <div class="mb-12 reveal-text">
                <!-- LOGO -->
                <img src="dapps.png" alt="dapps.co Logo" class="w-32 h-32 md:w-48 md:h-48 object-contain logo-glow">
            </div>
            <h1 class="hero-text mb-6 reveal-text delay-100">dapps.co</h1>
            <h2 class="text-4xl font-light text-gray-600 dark:text-gray-300 reveal-text delay-200">
                The Financial Layer for Human Connection
            </h2>
        </div>
    </section>

    <!-- Slide 5: How It Works (The Engine) -->
    <section class="slide" id="slide-5">
        <div class="max-w-7xl w-full z-10 px-4">
            <h2 class="text-5xl font-bold mb-16 font-serif reveal-text text-center text-gray-900 dark:text-white">The Economic Engine</h2>
            
            <div class="relative flex flex-row items-center justify-center gap-8 reveal-text delay-100">
                
                <!-- Step 1: The Asset -->
                <div class="glass-card p-8 w-1/3 text-center relative group">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-400">Step 1</div>
                    <div class="text-5xl mb-6 group-hover:scale-110 transition-transform">⛓️</div>
                    <h3 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Create & Join</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Every community gets a token tradable on <span class="text-gray-900 dark:text-white font-bold">Uniswap</span>.</p>
                    <div class="inline-block bg-black/5 dark:bg-white/5 rounded px-3 py-1 text-xs text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">Users buy token to join</div>
                </div>

                <!-- Arrow -->
                <div class="block text-4xl text-gray-600 animate-pulse">→</div>
                
                <!-- Step 2: The Action -->
                <div class="glass-card p-8 w-1/3 text-center relative group border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-400">Step 2</div>
                    <div class="text-5xl mb-6 group-hover:scale-110 transition-transform">💸</div>
                    <h3 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Trading Volume</h3>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-4">Every buy, sell, and trade generates <span class="text-gray-900 dark:text-white font-bold">Real Yield</span>.</p>
                    <div class="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
                </div>

                <!-- Arrow -->
                <div class="block text-4xl text-gray-600 animate-pulse">→</div>

                <!-- Step 3: The Split (Value Capture) -->
                <div class="glass-card p-0 w-1/3 text-center relative overflow-hidden flex flex-col">
                    <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-green-400 z-20">Step 3</div>
                    
                    <!-- Creator Split -->
                    <div class="p-6 border-b border-black/10 dark:border-white/10 bg-indigo-100/50 dark:bg-indigo-900/20 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/30 transition-colors">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-indigo-600 dark:text-indigo-300">Creator</span>
                            <span class="text-xl font-bold text-gray-900 dark:text-white">0.25%</span>
                        </div>
                        <p class="text-xs text-left text-gray-500">Income for Community Admins</p>
                    </div>

                    <!-- DAO Split -->
                    <div class="p-6 bg-green-100/50 dark:bg-green-900/20 hover:bg-green-100/80 dark:hover:bg-green-900/30 transition-colors">
                        <div class="flex justify-between items-center mb-1">
                            <span class="font-bold text-green-600 dark:text-green-300">Reward Pool</span>
                            <span class="text-xl font-bold text-gray-900 dark:text-white">0.50%</span>
                        </div>
                        <p class="text-xs text-left text-gray-500">DAO Treasury controlled by users</p>
                    </div>
                </div>
            </div>

            <!-- Bottom Note -->
            <div class="text-center mt-12 reveal-text delay-300">
                <p class="text-gray-600 dark:text-gray-400 italic">
                    "A self-sustaining economy where <span class="text-gray-900 dark:text-white">creators earn</span> and <span class="text-gray-900 dark:text-white">users govern</span>."
                </p>
            </div>
        </div>
    </section>

    <!-- Slide 6: The Secret Sauce (Renamed) -->
    <section class="slide" id="slide-6">
        <div class="max-w-7xl w-full px-8 z-10">
            <h2 class="text-5xl font-bold mb-16 font-serif reveal-text text-gray-900 dark:text-white">The Secret Sauce</h2>
            <div class="grid grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="stat-card reveal-text delay-100 group">
                    <div class="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🛡️</div>
                    <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Rug Pull Protection</h3>
                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Algorithmic pricing ensures instant liquidity. You can sell anytime. No lockups. No scams.
                    </p>
                </div>
                <!-- Card 2 -->
                <div class="stat-card reveal-text delay-200 group">
                    <div class="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
                    <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">"No Slop" Engine</h3>
                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                        We verify humanity. If you're a bot, you're out. A sanctuary for real, high-signal connection.
                    </p>
                </div>
                <!-- Card 3 -->
                <div class="stat-card reveal-text delay-300 group">
                    <div class="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">🤝</div>
                    <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Aligned Incentives</h3>
                    <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                        We don't sell ads. We don't sell data. We only make money when you make money.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Slide 7: Competition (Redesigned Axis) -->
    <section class="slide" id="slide-7">
        <div class="max-w-6xl w-full z-10 px-8">
            <h2 class="text-5xl font-bold mb-12 font-serif reveal-text text-center text-gray-900 dark:text-white">The Holy Grail</h2>

            <div class="relative h-[500px] w-full glass-card p-8 reveal-text delay-100">
                <!-- Axes -->
                <div class="absolute left-1/2 top-8 bottom-8 w-px bg-black/20 dark:bg-white/20"></div> <!-- Y Axis -->
                <div class="absolute top-1/2 left-8 right-8 h-px bg-black/20 dark:bg-white/20"></div> <!-- X Axis -->

                <!-- Labels -->
                <div
                    class="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-bold uppercase tracking-widest bg-white dark:bg-black px-2">
                    High User Ownership</div>
                <div
                    class="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-bold uppercase tracking-widest bg-white dark:bg-black px-2">
                    Low User Ownership</div>
                <div
                    class="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 font-bold uppercase tracking-widest bg-white dark:bg-black px-2">
                    Speculation / Gambling</div>
                <div
                    class="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-xs text-gray-500 font-bold uppercase tracking-widest bg-white dark:bg-black px-2">
                    Real Sustainability</div>

                <!-- Competitors -->
                <div
                    class="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 flex flex-col items-center group">
                    <div
                        class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold mb-2 shadow-lg group-hover:scale-110 transition-transform text-white">
                        X</div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">Twitter/FB</span>
                </div>

                <div
                    class="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group">
                    <div
                        class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-xl font-bold mb-2 shadow-lg group-hover:scale-110 transition-transform">
                        💊</div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">Pump.fun</span>
                </div>

                <div class="absolute top-1/2 left-1/3 translate-x-0 -translate-y-1/2 flex flex-col items-center group">
                    <div
                        class="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-xl font-bold mb-2 shadow-lg group-hover:scale-110 transition-transform">
                        FT</div>
                    <span class="text-sm text-gray-600 dark:text-gray-400">Friend.tech</span>
                </div>

                <!-- Us -->
                <div class="absolute top-1/4 right-1/4 translate-x-0 -translate-y-1/2 flex flex-col items-center z-10">
                    <div
                        class="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.6)] animate-pulse">
                        <img src="dapps.png" class="w-16 h-16 object-contain">
                    </div>
                    <span class="text-xl font-bold text-gray-900 dark:text-white mt-4">dapps.co</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Slide 8: Business Model (With Comps) -->
    <section class="slide" id="slide-8">
        <div class="max-w-6xl w-full z-10 px-8 text-center">
            <h2 class="text-6xl font-bold font-serif mb-16 reveal-text text-gray-900 dark:text-white">Proven Model</h2>

            <div class="grid grid-cols-3 gap-8 reveal-text delay-100">
                <!-- Comp 1 -->
                <div class="glass-card p-8 opacity-50 hover:opacity-100 transition-opacity">
                    <h3 class="text-xl font-bold mb-2 text-gray-600 dark:text-gray-400">Pump.fun</h3>
                    <div class="text-4xl font-bold text-gray-900 dark:text-white mb-2">$800M</div>
                    <p class="text-sm text-gray-500">Fees Generated</p>
                </div>

                <!-- Us -->
                <div class="glass-card p-12 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.2)] scale-110 z-10">
                    <h3 class="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">dapps.co</h3>
                    <div class="text-6xl font-bold text-gray-900 dark:text-white mb-4">0.25%</div>
                    <p class="text-lg text-gray-600 dark:text-gray-300">Transaction Fee</p>
                </div>

                <!-- Comp 2 -->
                <div class="glass-card p-8 opacity-50 hover:opacity-100 transition-opacity">
                    <h3 class="text-xl font-bold mb-2 text-gray-600 dark:text-gray-400">Believe.app</h3>
                    <div class="text-4xl font-bold text-gray-900 dark:text-white mb-2">$200M</div>
                    <p class="text-sm text-gray-500">Fees Generated</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Slide 9: Traction & Achievements -->
    <section class="slide" id="slide-9">
        <div class="max-w-6xl w-full z-10 px-8 text-center">
            <h2 class="text-sm font-bold tracking-[0.5em] text-gray-500 mb-12 uppercase reveal-text">Validated & Growing
            </h2>

            <div class="grid grid-cols-4 gap-12 mb-16">
                <div class="reveal-text delay-100">
                    <div class="text-7xl font-bold text-gray-900 dark:text-white mb-2">25k</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-widest">Active Users</div>
                </div>
                <div class="reveal-text delay-200">
                    <div class="text-7xl font-bold text-gray-900 dark:text-white mb-2">92k</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-widest">Waitlist</div>
                </div>
                <div class="reveal-text delay-300">
                    <div class="text-7xl font-bold text-gray-900 dark:text-white mb-2">60+</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-widest">Communities</div>
                </div>
                <div class="reveal-text delay-500">
                    <div class="text-7xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">$0</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-widest">Marketing Spend</div>
                </div>
            </div>

            <div class="reveal-text delay-500 border-t border-black/10 dark:border-white/10 pt-12">
                <h3 class="text-lg font-bold text-gray-600 dark:text-gray-400 mb-6">Achievements</h3>
                <div class="flex flex-wrap justify-center gap-4 text-gray-900 dark:text-white">
                    <span class="px-6 py-3 bg-black/5 dark:bg-white/5 rounded-full border border-black/10 dark:border-white/10">🏆 Won TON Hackathon</span>
                    <span class="px-6 py-3 bg-black/5 dark:bg-white/5 rounded-full border border-black/10 dark:border-white/10">🚀 Outlier Ventures
                        Accelerator</span>
                    <span class="px-6 py-3 bg-black/5 dark:bg-white/5 rounded-full border border-black/10 dark:border-white/10">💡 Cracked Labs
                        Incubator</span>
                    <span class="px-6 py-3 bg-black/5 dark:bg-white/5 rounded-full border border-black/10 dark:border-white/10">🥇 Won Soonami
                        Venturethon</span>
                    <span class="px-6 py-3 bg-black/5 dark:bg-white/5 rounded-full border border-black/10 dark:border-white/10">💰 Received Grants</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Slide 10: Team -->
    <section class="slide" id="slide-10">
        <div class="max-w-6xl w-full z-10 px-8">
            <h2 class="text-6xl font-bold font-serif mb-16 reveal-text text-gray-900 dark:text-white">14 Years. One Mission.</h2>

            <div class="grid grid-cols-2 gap-16 mb-16">
                <div class="reveal-text delay-100 flex gap-6 items-center">
                    <img src="mohit.jpeg"
                        class="w-32 h-32 rounded-2xl flex-shrink-0 border border-black/10 dark:border-white/10 object-cover">
                    <div>
                        <h3 class="text-3xl font-bold mb-1 text-gray-900 dark:text-white">Mohit Madan</h3>
                        <p class="text-indigo-600 dark:text-indigo-400 mb-4">CEO & Co-Founder</p>
                        <ul class="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                            <li>• Serial Entrepreneur (14 years)</li>
                            <li>• Built India's 1st ETH Exchange ($120M Vol)</li>
                            <li>• Angel Investor in 70+ Startups</li>
                        </ul>
                    </div>
                </div>
                <div class="reveal-text delay-200 flex gap-6 items-center">
                    <img src="tarusha.jpeg"
                        class="w-32 h-32 rounded-2xl flex-shrink-0 border border-black/10 dark:border-white/10 object-cover">
                    <div>
                        <h3 class="text-3xl font-bold mb-1 text-gray-900 dark:text-white">Tarusha Mittal</h3>
                        <p class="text-purple-600 dark:text-purple-400 mb-4">COO & Co-Founder</p>
                        <ul class="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
                            <li>• Award-winning Tech Leader</li>
                            <li>• Tokenized Gold/Silver on Tezos</li>
                            <li>• Won Next Big Idea & 1776 Challenge</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="reveal-text delay-300 bg-black/5 dark:bg-white/5 p-8 rounded-2xl border border-black/10 dark:border-white/10">
                <h4 class="text-sm uppercase tracking-widest text-gray-500 mb-6">Backed By Founders Of</h4>
                <div class="flex flex-wrap gap-x-8 gap-y-4 text-lg font-medium text-gray-700 dark:text-gray-300">
                    <span>WazirX</span>
                    <span>Holochain</span>
                    <span>Polygon</span>
                    <span>Celo</span>
                    <span>Hercules DAO</span>
                    <span>Pivot</span>
                    <span>Reflexical</span>
                    <span>Scribble DAO</span>
                </div>
            </div>
    </section>

    <!-- Slide 11: The Vision -->
    <section class="slide" id="slide-11">
        <div class="text-center max-w-4xl z-10">
            <h2 class="text-7xl font-bold mb-8 font-display reveal-text text-gray-900 dark:text-white">The Future is <span
                    class="gradient-text text-indigo-600 dark:text-indigo-400">User-Owned</span>.</h2>
            <p class="text-2xl text-gray-600 dark:text-gray-400 font-light leading-relaxed reveal-text delay-200">
                We are building the infrastructure for the next generation of digital nations.
            </p>
        </div>
    </section>

    <!-- Slide 12: The Ask -->
    <section class="slide" id="slide-12">
        <div class="max-w-4xl w-full z-10 text-center px-8">
            <h2 class="text-2xl text-gray-500 uppercase tracking-[0.5em] mb-12 reveal-text">Seed Round</h2>

            <div class="reveal-text delay-100 mb-16">
                <h1 class="text-[10rem] font-bold leading-none text-gray-900 dark:text-white tracking-tighter">$1.5M</h1>
                <p class="text-2xl text-indigo-600 dark:text-indigo-400 mt-4">SAFE + Token Warrant</p>
            </div>

            <div class="reveal-text delay-300">
                <a href="mailto:m@dapps.co"
                    class="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 font-lg rounded-full hover:bg-indigo-700 hover:scale-105 focus:outline-none ring-offset-2 focus:ring-2 ring-indigo-400">
                    Join the Movement
                    <svg class="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" fill="none"
                        stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                </a>
                <p class="mt-8 text-gray-500">m@dapps.co</p>
            </div>
        </div>
    </section>

    <!-- Progress Bar -->
    <div class="progress-container" id="progress-container"></div>

    </div> <!-- End #deck-wrapper -->

    <script>
        // Navigation Logic
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const progressContainer = document.getElementById('progress-container');
        const totalSlides = slides.length;

        // Init Progress Dots
        slides.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = `progress-dot ${i === 0 ? 'active' : ''}`;
            dot.onclick = () => goToSlide(i);
            progressContainer.appendChild(dot);
        });

        const dots = document.querySelectorAll('.progress-dot');

        function updateSlides() {
            slides.forEach((slide, i) => {
                slide.classList.remove('active', 'prev');
                if (i === currentSlide) {
                    slide.classList.add('active');
                } else if (i < currentSlide) {
                    slide.classList.add('prev');
                }
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentSlide);
            });
        }

        function goToSlide(index) {
            if (index >= 0 && index < totalSlides) {
                currentSlide = index;
                updateSlides();
            }
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function prevSlide() {
            goToSlide(currentSlide - 1);
        }

        // Keyboard Events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
                nextSlide();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                prevSlide();
            }
        });

        // Wheel Events (Debounced)
        let isScrolling = false;
        document.addEventListener('wheel', (e) => {
            if (isScrolling) return;
            isScrolling = true;
            setTimeout(() => { isScrolling = false; }, 1000); // 1s cooldown

            if (e.deltaY > 0) nextSlide();
            else prevSlide();
        });

        // Touch Events for Mobile Swipe
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        });

        function handleSwipe() {
            const xDiff = touchStartX - touchEndX;
            const yDiff = touchStartY - touchEndY;
            
            // Detect vertical swipe (more natural for this deck style)
            if (Math.abs(yDiff) > Math.abs(xDiff)) {
                if (Math.abs(yDiff) > 50) { // Threshold
                    if (yDiff > 0) {
                        nextSlide(); // Swipe up -> Next
                    } else {
                        prevSlide(); // Swipe down -> Prev
                    }
                }
            } else {
                // Horizontal swipe fallback
                if (Math.abs(xDiff) > 50) {
                    if (xDiff > 0) {
                        nextSlide(); // Swipe left -> Next
                    } else {
                        prevSlide(); // Swipe right -> Prev
                    }
                }
            }
        }

        // Theme Toggle Logic
        const themeToggleBtn = document.getElementById('theme-toggle');
        const html = document.documentElement;
        const body = document.body;
        
        // Check local storage (default to dark)
        if (localStorage.theme === 'light') {
            body.classList.remove('dark');
            html.classList.remove('dark');
            html.classList.add('light');
        } else {
            body.classList.add('dark');
            html.classList.add('dark');
            html.classList.remove('light');
            // Ensure we set the default in local storage if not present, or just leave it dynamic?
            // Actually, let's just default to dark visually. 
            // If we want to persist "default is dark", we don't strictly need to set localStorage here, 
            // but setting it ensures consistency if they reload.
            // However, the prompt just said "By default should be dark mode".
        }

        themeToggleBtn.addEventListener('click', () => {
            if (body.classList.contains('dark')) {
                body.classList.remove('dark');
                html.classList.remove('dark');
                html.classList.add('light');
                localStorage.theme = 'light';
            } else {
                body.classList.add('dark');
                html.classList.add('dark');
                html.classList.remove('light');
                localStorage.theme = 'dark';
            }
        });

        // Scaled Desktop Logic
        function scaleDeck() {
            const wrapper = document.getElementById('deck-wrapper');
            if (!wrapper) return;

            const baseWidth = 1280;
            const baseHeight = 720;
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Calculate scale to fit width exactly
            // We use Math.min to ensure it doesn't overflow height if the screen is extremely wide/short (unlikely on mobile portrait, but good for safety)
            // But user asked for "horizontal box", so width priority is key.
            let scale = windowWidth / baseWidth;
            
            // Apply scale
            wrapper.style.transform = `scale(${scale})`;
            
            // Center Vertically
            const scaledHeight = baseHeight * scale;
            const topOffset = (windowHeight - scaledHeight) / 2;
            
            wrapper.style.top = `${topOffset}px`;
            wrapper.style.left = '0px'; // Always 0 since we scaled to fit width
            
            // If window is wider than aspect ratio (e.g. desktop), we might want to center horizontally too?
            // But for mobile (portrait), width is the constraint.
            // Let's make it robust:
            if (windowWidth > baseWidth * scale) {
                 // This case shouldn't happen if scale = windowWidth / baseWidth
                 // But if we capped scale, we would need this.
            }
        }

        window.addEventListener('load', scaleDeck);
        window.addEventListener('resize', scaleDeck);
        document.addEventListener('DOMContentLoaded', scaleDeck);

    </script>
    <?php endif; ?>
</body>

</html>
