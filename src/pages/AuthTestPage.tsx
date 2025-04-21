import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';

const AuthTestPage = () => {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const [localStorageData, setLocalStorageData] = useState<Record<string, string | null>>({});
  const [testAuthResponse, setTestAuthResponse] = useState<string | null>(null);
  const [privyAuthResponse, setPrivyAuthResponse] = useState<string | null>(null);

  const refreshLocalStorage = () => {
    setLocalStorageData({
      dapps_user_id: localStorage.getItem('dapps_user_id'),
      dapps_last_auth_time: localStorage.getItem('dapps_last_auth_time'),
      dapps_user_registered: localStorage.getItem('dapps_user_registered'),
      dapps_user_handle: localStorage.getItem('dapps_user_handle'),
      dapps_user_avatar: localStorage.getItem('dapps_user_avatar'),
    });
  };

  useEffect(() => {
    refreshLocalStorage();
  }, [ready, authenticated]); // Refresh when auth state changes

  const handleTestAuth = async () => {
    setTestAuthResponse('Testing...');
    try {
      const response = await fetch(`/api/test-auth`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      setTestAuthResponse(`Status: ${response.status} ${response.statusText}\nBody: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setTestAuthResponse(`Error: ${error.message}`);
    }
  };

  const handlePrivyAuth = async () => {
    setPrivyAuthResponse('Running...');
    if (!ready || !authenticated || !user) {
      setPrivyAuthResponse('Privy not ready or user not authenticated.');
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        setPrivyAuthResponse('Could not get Privy access token.');
        return;
      }

      const response = await fetch(`/api/privy_auth`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          privyId: user.id,
          email: user.email?.address,
          wallet: user.wallet?.address,
        }),
      });

      let responseBody = '';
      try {
        responseBody = await response.text(); // Read as text first
        const data = JSON.parse(responseBody); // Try parsing
        setPrivyAuthResponse(`Status: ${response.status} ${response.statusText}\nBody: ${JSON.stringify(data, null, 2)}`);
      } catch (jsonError) {
        // If JSON parsing failed, show the raw text body
        setPrivyAuthResponse(`Status: ${response.status} ${response.statusText}\nNon-JSON Body: ${responseBody}`);
      }
      
      // Refresh local storage after attempt
      refreshLocalStorage();

    } catch (error: any) {
      setPrivyAuthResponse(`Error: ${error.message}`);
    }
  };
  
  const handleClearStorage = () => {
    localStorage.removeItem('dapps_user_id');
    localStorage.removeItem('dapps_last_auth_time');
    localStorage.removeItem('dapps_user_registered');
    localStorage.removeItem('dapps_user_handle');
    localStorage.removeItem('dapps_user_avatar');
    refreshLocalStorage();
    setTestAuthResponse(null);
    setPrivyAuthResponse(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClearStorage(); // Also clear our storage on logout
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>

      <div className="space-x-2">
        <Button onClick={login} disabled={!ready}>Login with Privy</Button>
        <Button onClick={handleLogout} disabled={!ready || !authenticated} variant="destructive">Logout</Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Privy Status</h2>
        <pre className="p-2 bg-muted rounded text-sm">
          Ready: {ready ? 'Yes' : 'No'}\n
          Authenticated: {authenticated ? 'Yes' : 'No'}\n
          User ID: {user?.id || 'N/A'}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Local Storage</h2>
        <Button onClick={refreshLocalStorage} size="sm" variant="outline" className="mb-2">Refresh Local Storage</Button>
        <Button onClick={handleClearStorage} size="sm" variant="destructive" className="mb-2 ml-2">Clear Auth Storage</Button>
        <pre className="p-2 bg-muted rounded text-sm">
          {JSON.stringify(localStorageData, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Backend /test-auth</h2>
        <Button onClick={handleTestAuth} disabled={!ready}>Test Backend Auth (/test-auth)</Button>
        {testAuthResponse && (
          <pre className="mt-2 p-2 bg-muted rounded text-sm whitespace-pre-wrap">
            {testAuthResponse}
          </pre>
        )}
      </div>
      
      <div>
        <h2 className="text-lg font-semibold">Backend /privy_auth</h2>
        <Button onClick={handlePrivyAuth} disabled={!ready || !authenticated}>Run Privy Auth Flow (/privy_auth)</Button>
        {privyAuthResponse && (
          <pre className="mt-2 p-2 bg-muted rounded text-sm whitespace-pre-wrap">
            {privyAuthResponse}
          </pre>
        )}
      </div>

    </div>
  );
};

export default AuthTestPage; 