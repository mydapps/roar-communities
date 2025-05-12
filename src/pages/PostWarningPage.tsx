import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getWarningDetails, WarningDetailsData } from '@/utils/communityApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, FileText, Quote } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
                if (response.success && response.data) {
                    setWarningDetails(response.data);
                } else {
                    setError(response.message || "Failed to load warning details.");
                }
            } catch (err) {
                console.error("Error fetching warning details:", err);
                setError("An unexpected error occurred while fetching warning details.");
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
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
             <div className="container mx-auto p-4 max-w-2xl">
                 <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                 <Button onClick={handleBackToCommunity} variant="outline" className="mt-4">
                     Back to Community
                 </Button>
            </div>
        );
    }

    if (!warningDetails) {
        // Should ideally not happen if no error and not loading, but good practice
         return (
             <div className="container mx-auto p-4 max-w-2xl">
                 <Alert>
                    <AlertTitle>No Details</AlertTitle>
                    <AlertDescription>Warning details could not be loaded.</AlertDescription>
                </Alert>
                 <Button onClick={handleBackToCommunity} variant="outline" className="mt-4">
                     Back to Community
                 </Button>
             </div>
         );
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Card className="shadow-lg">
                <CardHeader className="bg-destructive/10">
                     <div className="flex items-center space-x-2">
                         <ShieldAlert className="h-6 w-6 text-destructive" />
                        <CardTitle className="text-destructive">Your Post Was Removed</CardTitle>
                    </div>
                    <CardDescription>An administrator reviewed your post and took action.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-1">Reason for Removal</h3>
                        <p className="text-sm text-muted-foreground font-medium">{warningDetails.flag_type_name}</p>
                        <p className="text-sm text-muted-foreground italic">"{warningDetails.flag_type_description}"</p>
                    </div>

                    {warningDetails.warning_details && (
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-1">Admin Comments</h3>
                            <p className="text-sm text-muted-foreground">{warningDetails.warning_details}</p>
                        </div>
                    )}

                     <Separator className="my-4" />

                    <div className="mb-4">
                         <h3 className="text-lg font-semibold mb-2 flex items-center">
                             <FileText className="h-5 w-5 mr-2" />
                             Removed Post Content
                         </h3>
                        <blockquote className="border-l-4 border-muted pl-4 py-2 bg-muted/50 rounded-md">
                            <Quote className="h-4 w-4 text-muted-foreground inline-block mr-1" />
                             <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">{warningDetails.post_body}</p>
                        </blockquote>
                    </div>

                     <Separator className="my-4" />

                     <Alert variant={warningDetails.warning_count > 2 ? "destructive" : "default"} className="mt-4">
                         <ShieldAlert className="h-4 w-4" />
                         <AlertTitle>Warning Count</AlertTitle>
                         <AlertDescription>
                             You have received <span className="font-bold">{warningDetails.warning_count}</span> warning{warningDetails.warning_count > 1 ? 's' : ''} in this community.
                             {warningDetails.warning_count > 1 && " Please be mindful of the community rules to avoid further action."}
                         </AlertDescription>
                     </Alert>

                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handleBackToCommunity} variant="outline">
                        Back to Community
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PostWarningPage; 