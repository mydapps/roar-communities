#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// This is a category extension to fix the warnings in the Keyboard plugin
@interface CAPKeyboardPlugin (PropertyFix)
@property (nonatomic, copy, readwrite) NSString *identifier;
@property (nonatomic, copy, readwrite) NSString *jsName;
@property (nonatomic, copy, readwrite) NSDictionary *pluginMethods;
@end

@implementation CAPKeyboardPlugin (PropertyFix)
// No need to implement anything here as we're just declaring the properties
// to satisfy the compiler warnings
@end 