import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWarningDetails, WarningDetailsData } from '@/utils/communityApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, FileText, Quote } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const PostWarningPage: React.FC = () => {
    const { communityName, postCode } = useParams<{ communityName: string; postCode: string }>();
    const navigate = useNavigate();
    const [warningDetails, setWarningDetails] = useState<WarningDetailsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!communityName || !postCode) {
                setError("Community name or post code is missing.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const response = await getWarningDetails(communityName, postCode);

                // Log the entire response for debugging
                console.log('[PostWarningPage] Raw API Response:', JSON.parse(JSON.stringify(response)));

                if (response && response.success && response.data) {
                    setWarningDetails(response.data);
                } else {
                    // Log the response again if it led to an error state
                    console.error('[PostWarningPage] Problematic API Response:', JSON.parse(JSON.stringify(response)));
                    const errorMessage = response?.message || "Failed to fetch warning details from the server.";
                    setError(errorMessage);
                    toast.error(errorMessage);
                }
            } catch (err) {
                console.error("Error fetching warning details:", err);
                const message = "An unexpected network or server error occurred. Please try again later.";
                setError(message);
                toast.error(message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [communityName, postCode]);

    const handleBackToCommunity = () => {
        navigate(`/c/${communityName}`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
             <div className="container mx-auto p-4 py-10 max-w-2xl">
                 <Card className="border-destructive bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center">
                            <ShieldAlert className="h-5 w-5 mr-2" />
                            Error Loading Warning Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-destructive/90">{error}</p>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleBackToCommunity} variant="outline" size="sm">
                             Back to Community
                         </Button>
                    </CardFooter>
                 </Card>
            </div>
        );
    }

    if (!warningDetails) {
        return (
             <div className="container mx-auto p-4 py-10 max-w-2xl">
                 <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center">
                             <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                             Details Unavailable
                         </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Warning details could not be loaded or are unavailable.</p>
                    </CardContent>
                    <CardFooter>
                         <Button onClick={handleBackToCommunity} variant="outline" size="sm">
                             Back to Community
                         </Button>
                    </CardFooter>
                 </Card>
             </div>
         );
    }

    return (
        <div className="container mx-auto p-4 py-10 max-w-2xl space-y-6 mt-6">
            
            <Card className="overflow-hidden shadow-md">
                 <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-primary-foreground p-6">
                     <div className="flex items-center space-x-3">
                         <ShieldAlert className="h-8 w-8" />
                         <div>
                            <CardTitle className="text-2xl">Post Removed by Community Moderator</CardTitle>
                            <CardDescription className="text-red-100">Your post in the '{communityName}' community was flagged and removed.</CardDescription>
                         </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-5">
                     <div>
                         <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-1">Reason for Removal</h3>
                         <p className="text-lg font-semibold">{warningDetails.flag_type_name}</p>
                         <p className="text-sm text-muted-foreground italic">"{warningDetails.flag_type_description}"</p>
                     </div>

                    {warningDetails.warning_details && (
                         <div>
                             <Separator className="my-4" />
                             <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-1">Administrator Comments</h3>
                             <p className="text-base bg-muted/50 p-3 rounded-md border border-dashed">{warningDetails.warning_details}</p>
                         </div>
                    )}

                     <div>
                         <Separator className="my-4" />
                         <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2 flex items-center">
                             <FileText className="h-4 w-4 mr-1.5" />
                             Removed Post Content
                         </h3>
                        <blockquote 
                            className="border-l-4 border-muted pl-4 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground italic"
                            dangerouslySetInnerHTML={{ __html: warningDetails.post_body }}
                        />
                    </div>

                     <div>
                         <Separator className="my-4" />
                         <Alert variant={warningDetails.warning_count >= 3 ? "destructive" : "default"} className="mt-4">
                             <ShieldAlert className="h-4 w-4" />
                             <AlertTitle>Warning Count</AlertTitle>
                             <AlertDescription>
                                 You have received <span className="font-bold">{warningDetails.warning_count}</span> warning{warningDetails.warning_count !== 1 ? 's' : ''} in this community.
                                 {warningDetails.warning_count > 1 && " Repeated violations may lead to further restrictions. Please adhere to community guidelines."}
                             </AlertDescription>
                         </Alert>
                    </div>
                </CardContent>

                <CardFooter className="bg-muted/30 p-4 flex justify-center border-t">
                    <Button onClick={handleBackToCommunity} variant="outline">
                        Go Back
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PostWarningPage; 