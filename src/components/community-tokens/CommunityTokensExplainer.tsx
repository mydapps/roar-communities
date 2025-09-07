import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Crown, 
  Users, 
  Coins, 
  ArrowRight,
  Sparkles,
  Target,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CommunityTokensExplainerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommunityTokensExplainer: React.FC<CommunityTokensExplainerProps> = ({ isOpen, onClose }) => {
  const steps = [
    {
      icon: <Crown className="w-8 h-8" />,
      title: "Own Your Tribe",
      subtitle: "Build something bigger than yourself",
      description: "Community tokens aren't just digital assets—they're the heartbeat of belonging. When you create a community token, you're not just launching a cryptocurrency; you're founding a movement. Every transaction becomes a vote of confidence in your vision, and as the creator, you earn 0.25% from every trade. This isn't passive income—it's proof that your community matters.",
      color: "from-yellow-400 to-orange-500",
      bgColor: "from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "The Community Decides",
      subtitle: "Democracy in action",
      description: "The reward pool isn't just a wallet—it's your community's collective voice. Every trade contributes 0.5% to this shared treasury, but here's what makes it powerful: your community votes on how to use these funds. Want to sponsor a hackathon? Fund a creator? Support a cause? The people who believe in your vision get to shape its future. This is how communities become movements.",
      color: "from-blue-400 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Join the Conversation",
      subtitle: "Your stake, your voice",
      description: "When you buy community tokens, you're not just making an investment—you're choosing your tribe. Each token represents your belief in that community's future. You're not just a holder; you're a participant, a contributor, a voice in the conversation. Every community becomes its own economy, its own world, where your participation shapes the narrative.",
      color: "from-green-400 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
    }
  ];

  const [currentStep, setCurrentStep] = React.useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-2xl">
              <CardContent className="p-0">
                {/* Header */}
                <div className="relative p-6 pb-4">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4"
                    >
                      <Sparkles className="w-4 h-4" />
                      What are Community Tokens?
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold mb-2">
                      The Future of Digital Communities
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Discover how community tokens create belonging, not just ownership
                    </p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center px-6 mb-6">
                  <div className="flex items-center space-x-2">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentStep
                            ? 'bg-blue-600 w-8'
                            : index < currentStep
                            ? 'bg-blue-400'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <div className={`p-6 rounded-2xl bg-gradient-to-br ${steps[currentStep].bgColor} border`}>
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${steps[currentStep].color} text-white mb-4`}>
                        {steps[currentStep].icon}
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold mb-2">
                        {steps[currentStep].title}
                      </h3>
                      
                      {/* Subtitle */}
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-4">
                        {steps[currentStep].subtitle}
                      </p>

                      {/* Description */}
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                        {steps[currentStep].description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between p-6 pt-0">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    Previous
                  </Button>

                  <span className="text-sm text-gray-500">
                    {currentStep + 1} of {steps.length}
                  </span>

                  <Button
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <Heart className="w-4 h-4" />
                        Got it!
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommunityTokensExplainer;




