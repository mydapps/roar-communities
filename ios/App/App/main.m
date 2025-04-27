#import <UIKit/UIKit.h>
#import <Capacitor/Capacitor.h>

// Include our patch
#import "Keyboard-patch.m"

int main(int argc, char * argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass([AppDelegate class]));
    }
} 