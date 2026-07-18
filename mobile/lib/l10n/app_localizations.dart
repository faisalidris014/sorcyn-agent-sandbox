import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_ja.dart';
import 'app_localizations_ko.dart';
import 'app_localizations_pt.dart';
import 'app_localizations_vi.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('hi'),
    Locale('ja'),
    Locale('ko'),
    Locale('pt'),
    Locale('vi'),
    Locale('zh'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Reverse Marketplace'**
  String get appTitle;

  /// Tooltip/label for dismissing the in-app announcement banner
  ///
  /// In en, this message translates to:
  /// **'Dismiss'**
  String get announcementDismiss;

  /// No description provided for @home.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get home;

  /// No description provided for @feed.
  ///
  /// In en, this message translates to:
  /// **'Feed'**
  String get feed;

  /// No description provided for @myPosts.
  ///
  /// In en, this message translates to:
  /// **'My Posts'**
  String get myPosts;

  /// No description provided for @myOffers.
  ///
  /// In en, this message translates to:
  /// **'My Offers'**
  String get myOffers;

  /// No description provided for @messages.
  ///
  /// In en, this message translates to:
  /// **'Messages'**
  String get messages;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @selectLanguage.
  ///
  /// In en, this message translates to:
  /// **'Select Language'**
  String get selectLanguage;

  /// No description provided for @marketplace.
  ///
  /// In en, this message translates to:
  /// **'Marketplace'**
  String get marketplace;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Log In'**
  String get login;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get register;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get confirmPassword;

  /// No description provided for @firstName.
  ///
  /// In en, this message translates to:
  /// **'First Name'**
  String get firstName;

  /// No description provided for @lastName.
  ///
  /// In en, this message translates to:
  /// **'Last Name'**
  String get lastName;

  /// No description provided for @phone.
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phone;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot Password?'**
  String get forgotPassword;

  /// No description provided for @resetPassword.
  ///
  /// In en, this message translates to:
  /// **'Reset Password'**
  String get resetPassword;

  /// No description provided for @sendResetLink.
  ///
  /// In en, this message translates to:
  /// **'Send Reset Link'**
  String get sendResetLink;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get createAccount;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get alreadyHaveAccount;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get dontHaveAccount;

  /// No description provided for @signUp.
  ///
  /// In en, this message translates to:
  /// **'Sign Up'**
  String get signUp;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log Out'**
  String get logOut;

  /// No description provided for @deleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get deleteAccount;

  /// No description provided for @verifyEmail.
  ///
  /// In en, this message translates to:
  /// **'Verify Email'**
  String get verifyEmail;

  /// No description provided for @verifyEmailTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify Your Email'**
  String get verifyEmailTitle;

  /// No description provided for @verifyEmailDescription.
  ///
  /// In en, this message translates to:
  /// **'We sent a verification link to your email. Please check your inbox and click the link to verify.'**
  String get verifyEmailDescription;

  /// No description provided for @resendVerification.
  ///
  /// In en, this message translates to:
  /// **'Resend Verification'**
  String get resendVerification;

  /// No description provided for @emailVerified.
  ///
  /// In en, this message translates to:
  /// **'Email Verified'**
  String get emailVerified;

  /// No description provided for @checkYourEmail.
  ///
  /// In en, this message translates to:
  /// **'Check your email'**
  String get checkYourEmail;

  /// No description provided for @resetPasswordSent.
  ///
  /// In en, this message translates to:
  /// **'Password reset link sent to your email'**
  String get resetPasswordSent;

  /// No description provided for @enterNewPassword.
  ///
  /// In en, this message translates to:
  /// **'Enter your new password'**
  String get enterNewPassword;

  /// No description provided for @passwordResetSuccess.
  ///
  /// In en, this message translates to:
  /// **'Password reset successfully'**
  String get passwordResetSuccess;

  /// No description provided for @buyerMode.
  ///
  /// In en, this message translates to:
  /// **'Buyer'**
  String get buyerMode;

  /// No description provided for @sellerMode.
  ///
  /// In en, this message translates to:
  /// **'Seller'**
  String get sellerMode;

  /// No description provided for @currentMode.
  ///
  /// In en, this message translates to:
  /// **'Current Mode'**
  String get currentMode;

  /// No description provided for @switchToBuyer.
  ///
  /// In en, this message translates to:
  /// **'Switch to Buyer'**
  String get switchToBuyer;

  /// No description provided for @switchToSeller.
  ///
  /// In en, this message translates to:
  /// **'Switch to Seller'**
  String get switchToSeller;

  /// No description provided for @accountType.
  ///
  /// In en, this message translates to:
  /// **'Account Type'**
  String get accountType;

  /// No description provided for @buyer.
  ///
  /// In en, this message translates to:
  /// **'Buyer'**
  String get buyer;

  /// No description provided for @seller.
  ///
  /// In en, this message translates to:
  /// **'Seller'**
  String get seller;

  /// No description provided for @both.
  ///
  /// In en, this message translates to:
  /// **'Both'**
  String get both;

  /// No description provided for @b2c.
  ///
  /// In en, this message translates to:
  /// **'B2C'**
  String get b2c;

  /// No description provided for @b2b.
  ///
  /// In en, this message translates to:
  /// **'B2B'**
  String get b2b;

  /// No description provided for @c2c.
  ///
  /// In en, this message translates to:
  /// **'C2C'**
  String get c2c;

  /// No description provided for @b2cDescription.
  ///
  /// In en, this message translates to:
  /// **'Business to Customer'**
  String get b2cDescription;

  /// No description provided for @b2bDescription.
  ///
  /// In en, this message translates to:
  /// **'Business to Business'**
  String get b2bDescription;

  /// No description provided for @c2cDescription.
  ///
  /// In en, this message translates to:
  /// **'Customer to Customer'**
  String get c2cDescription;

  /// No description provided for @createPost.
  ///
  /// In en, this message translates to:
  /// **'Create Post'**
  String get createPost;

  /// No description provided for @newPost.
  ///
  /// In en, this message translates to:
  /// **'New Post'**
  String get newPost;

  /// No description provided for @chooseMethod.
  ///
  /// In en, this message translates to:
  /// **'Choose how to create your post'**
  String get chooseMethod;

  /// No description provided for @aiAssisted.
  ///
  /// In en, this message translates to:
  /// **'AI Assisted'**
  String get aiAssisted;

  /// No description provided for @aiAssistedDesc.
  ///
  /// In en, this message translates to:
  /// **'Describe what you need and AI will create a structured post'**
  String get aiAssistedDesc;

  /// No description provided for @manual.
  ///
  /// In en, this message translates to:
  /// **'Manual'**
  String get manual;

  /// No description provided for @manualDesc.
  ///
  /// In en, this message translates to:
  /// **'Fill out the form yourself'**
  String get manualDesc;

  /// No description provided for @describeYourNeed.
  ///
  /// In en, this message translates to:
  /// **'Describe what you need'**
  String get describeYourNeed;

  /// No description provided for @aiWillParse.
  ///
  /// In en, this message translates to:
  /// **'AI will parse your description into a structured post'**
  String get aiWillParse;

  /// No description provided for @postTitle.
  ///
  /// In en, this message translates to:
  /// **'Title'**
  String get postTitle;

  /// No description provided for @postTitleHint.
  ///
  /// In en, this message translates to:
  /// **'What do you need? (e.g. Need a plumber for kitchen sink repair)'**
  String get postTitleHint;

  /// No description provided for @description.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get description;

  /// No description provided for @descriptionHint.
  ///
  /// In en, this message translates to:
  /// **'Describe your request in detail (min 20 characters)'**
  String get descriptionHint;

  /// No description provided for @budget.
  ///
  /// In en, this message translates to:
  /// **'Budget'**
  String get budget;

  /// No description provided for @budgetMin.
  ///
  /// In en, this message translates to:
  /// **'Min Budget'**
  String get budgetMin;

  /// No description provided for @budgetMax.
  ///
  /// In en, this message translates to:
  /// **'Max Budget'**
  String get budgetMax;

  /// No description provided for @postFieldSalaryLabel.
  ///
  /// In en, this message translates to:
  /// **'Salary'**
  String get postFieldSalaryLabel;

  /// No description provided for @postFieldSalaryHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. \$50,000/yr or \$25/hr'**
  String get postFieldSalaryHint;

  /// No description provided for @postFieldSalaryTypeHourly.
  ///
  /// In en, this message translates to:
  /// **'Hourly'**
  String get postFieldSalaryTypeHourly;

  /// No description provided for @postFieldSalaryTypeYearly.
  ///
  /// In en, this message translates to:
  /// **'Yearly'**
  String get postFieldSalaryTypeYearly;

  /// No description provided for @budgetType.
  ///
  /// In en, this message translates to:
  /// **'Budget Type'**
  String get budgetType;

  /// No description provided for @budgetRange.
  ///
  /// In en, this message translates to:
  /// **'Range'**
  String get budgetRange;

  /// No description provided for @budgetOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get budgetOpen;

  /// No description provided for @budgetFixed.
  ///
  /// In en, this message translates to:
  /// **'Fixed'**
  String get budgetFixed;

  /// No description provided for @location.
  ///
  /// In en, this message translates to:
  /// **'Location'**
  String get location;

  /// No description provided for @city.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get city;

  /// No description provided for @state.
  ///
  /// In en, this message translates to:
  /// **'State'**
  String get state;

  /// No description provided for @zipCode.
  ///
  /// In en, this message translates to:
  /// **'ZIP Code'**
  String get zipCode;

  /// No description provided for @address.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get address;

  /// No description provided for @urgency.
  ///
  /// In en, this message translates to:
  /// **'Urgency'**
  String get urgency;

  /// No description provided for @urgencyAsap.
  ///
  /// In en, this message translates to:
  /// **'ASAP'**
  String get urgencyAsap;

  /// No description provided for @urgencyWithin24h.
  ///
  /// In en, this message translates to:
  /// **'Within 24 Hours'**
  String get urgencyWithin24h;

  /// No description provided for @urgencyWithin3d.
  ///
  /// In en, this message translates to:
  /// **'Within 3 Days'**
  String get urgencyWithin3d;

  /// No description provided for @urgencyWithin1w.
  ///
  /// In en, this message translates to:
  /// **'Within 1 Week'**
  String get urgencyWithin1w;

  /// No description provided for @urgencyFlexible.
  ///
  /// In en, this message translates to:
  /// **'Flexible'**
  String get urgencyFlexible;

  /// No description provided for @urgencySpecificDate.
  ///
  /// In en, this message translates to:
  /// **'Specific Date'**
  String get urgencySpecificDate;

  /// No description provided for @preferredDate.
  ///
  /// In en, this message translates to:
  /// **'Preferred Date'**
  String get preferredDate;

  /// No description provided for @preferredTime.
  ///
  /// In en, this message translates to:
  /// **'Preferred Time'**
  String get preferredTime;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @subcategory.
  ///
  /// In en, this message translates to:
  /// **'Subcategory'**
  String get subcategory;

  /// No description provided for @selectCategory.
  ///
  /// In en, this message translates to:
  /// **'Select Category'**
  String get selectCategory;

  /// No description provided for @selectSubcategory.
  ///
  /// In en, this message translates to:
  /// **'Select Subcategory'**
  String get selectSubcategory;

  /// No description provided for @photos.
  ///
  /// In en, this message translates to:
  /// **'Photos'**
  String get photos;

  /// No description provided for @addPhotos.
  ///
  /// In en, this message translates to:
  /// **'Add Photos'**
  String get addPhotos;

  /// No description provided for @requirements.
  ///
  /// In en, this message translates to:
  /// **'Requirements'**
  String get requirements;

  /// No description provided for @publishPost.
  ///
  /// In en, this message translates to:
  /// **'Publish Post'**
  String get publishPost;

  /// No description provided for @saveDraft.
  ///
  /// In en, this message translates to:
  /// **'Save as Draft'**
  String get saveDraft;

  /// No description provided for @postCreated.
  ///
  /// In en, this message translates to:
  /// **'Post Created!'**
  String get postCreated;

  /// No description provided for @postCreatedDesc.
  ///
  /// In en, this message translates to:
  /// **'Your post is now live. Sellers will start submitting offers.'**
  String get postCreatedDesc;

  /// No description provided for @viewPost.
  ///
  /// In en, this message translates to:
  /// **'View Post'**
  String get viewPost;

  /// No description provided for @sharePost.
  ///
  /// In en, this message translates to:
  /// **'Share Post'**
  String get sharePost;

  /// No description provided for @goToDashboard.
  ///
  /// In en, this message translates to:
  /// **'Go to Dashboard'**
  String get goToDashboard;

  /// No description provided for @editPost.
  ///
  /// In en, this message translates to:
  /// **'Edit Post'**
  String get editPost;

  /// No description provided for @deletePost.
  ///
  /// In en, this message translates to:
  /// **'Delete Post'**
  String get deletePost;

  /// No description provided for @extendPost.
  ///
  /// In en, this message translates to:
  /// **'Extend Post'**
  String get extendPost;

  /// No description provided for @repost.
  ///
  /// In en, this message translates to:
  /// **'Repost'**
  String get repost;

  /// No description provided for @markAsFilled.
  ///
  /// In en, this message translates to:
  /// **'Mark as Filled'**
  String get markAsFilled;

  /// No description provided for @cancelPost.
  ///
  /// In en, this message translates to:
  /// **'Cancel Post'**
  String get cancelPost;

  /// No description provided for @draft.
  ///
  /// In en, this message translates to:
  /// **'Draft'**
  String get draft;

  /// No description provided for @active.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get active;

  /// No description provided for @filled.
  ///
  /// In en, this message translates to:
  /// **'Filled'**
  String get filled;

  /// No description provided for @expired.
  ///
  /// In en, this message translates to:
  /// **'Expired'**
  String get expired;

  /// No description provided for @cancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get cancelled;

  /// No description provided for @offers.
  ///
  /// In en, this message translates to:
  /// **'Offers'**
  String get offers;

  /// No description provided for @submitOffer.
  ///
  /// In en, this message translates to:
  /// **'Submit Offer'**
  String get submitOffer;

  /// No description provided for @noOffers.
  ///
  /// In en, this message translates to:
  /// **'No offers yet'**
  String get noOffers;

  /// No description provided for @offerCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No offers} =1{1 offer} other{{count} offers}}'**
  String offerCount(int count);

  /// No description provided for @quoteAmount.
  ///
  /// In en, this message translates to:
  /// **'Quote Amount'**
  String get quoteAmount;

  /// No description provided for @pricingType.
  ///
  /// In en, this message translates to:
  /// **'Pricing Type'**
  String get pricingType;

  /// No description provided for @flatRate.
  ///
  /// In en, this message translates to:
  /// **'Flat Rate'**
  String get flatRate;

  /// No description provided for @hourly.
  ///
  /// In en, this message translates to:
  /// **'Hourly'**
  String get hourly;

  /// No description provided for @quote.
  ///
  /// In en, this message translates to:
  /// **'Quote'**
  String get quote;

  /// No description provided for @estimatedHours.
  ///
  /// In en, this message translates to:
  /// **'Estimated Hours'**
  String get estimatedHours;

  /// No description provided for @canStartDate.
  ///
  /// In en, this message translates to:
  /// **'Can Start'**
  String get canStartDate;

  /// No description provided for @completionTime.
  ///
  /// In en, this message translates to:
  /// **'Completion Time'**
  String get completionTime;

  /// No description provided for @offerMessage.
  ///
  /// In en, this message translates to:
  /// **'Message to Buyer'**
  String get offerMessage;

  /// No description provided for @terms.
  ///
  /// In en, this message translates to:
  /// **'Terms & Conditions'**
  String get terms;

  /// No description provided for @warranty.
  ///
  /// In en, this message translates to:
  /// **'Warranty'**
  String get warranty;

  /// No description provided for @submitYourOffer.
  ///
  /// In en, this message translates to:
  /// **'Submit Your Offer'**
  String get submitYourOffer;

  /// No description provided for @pending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pending;

  /// No description provided for @accepted.
  ///
  /// In en, this message translates to:
  /// **'Accepted'**
  String get accepted;

  /// No description provided for @declined.
  ///
  /// In en, this message translates to:
  /// **'Declined'**
  String get declined;

  /// No description provided for @withdrawn.
  ///
  /// In en, this message translates to:
  /// **'Withdrawn'**
  String get withdrawn;

  /// No description provided for @acceptOffer.
  ///
  /// In en, this message translates to:
  /// **'Accept Offer'**
  String get acceptOffer;

  /// No description provided for @declineOffer.
  ///
  /// In en, this message translates to:
  /// **'Decline Offer'**
  String get declineOffer;

  /// No description provided for @withdrawOffer.
  ///
  /// In en, this message translates to:
  /// **'Withdraw Offer'**
  String get withdrawOffer;

  /// No description provided for @editOffer.
  ///
  /// In en, this message translates to:
  /// **'Edit Offer'**
  String get editOffer;

  /// No description provided for @bestMatch.
  ///
  /// In en, this message translates to:
  /// **'Best Match'**
  String get bestMatch;

  /// No description provided for @transactions.
  ///
  /// In en, this message translates to:
  /// **'Transactions'**
  String get transactions;

  /// No description provided for @transactionDetails.
  ///
  /// In en, this message translates to:
  /// **'Transaction Details'**
  String get transactionDetails;

  /// No description provided for @inProgress.
  ///
  /// In en, this message translates to:
  /// **'In Progress'**
  String get inProgress;

  /// No description provided for @completed.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get completed;

  /// No description provided for @scheduled.
  ///
  /// In en, this message translates to:
  /// **'Scheduled'**
  String get scheduled;

  /// No description provided for @shipped.
  ///
  /// In en, this message translates to:
  /// **'Shipped'**
  String get shipped;

  /// No description provided for @delivered.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get delivered;

  /// No description provided for @escrowHeld.
  ///
  /// In en, this message translates to:
  /// **'Escrow Held'**
  String get escrowHeld;

  /// No description provided for @escrowReleased.
  ///
  /// In en, this message translates to:
  /// **'Escrow Released'**
  String get escrowReleased;

  /// No description provided for @escrowRefunded.
  ///
  /// In en, this message translates to:
  /// **'Refunded'**
  String get escrowRefunded;

  /// No description provided for @uploadBeforePhotos.
  ///
  /// In en, this message translates to:
  /// **'Upload Before Photos'**
  String get uploadBeforePhotos;

  /// No description provided for @uploadAfterPhotos.
  ///
  /// In en, this message translates to:
  /// **'Upload After Photos'**
  String get uploadAfterPhotos;

  /// No description provided for @uploadProgressPhotos.
  ///
  /// In en, this message translates to:
  /// **'Upload Progress Photos'**
  String get uploadProgressPhotos;

  /// No description provided for @markComplete.
  ///
  /// In en, this message translates to:
  /// **'Mark Complete'**
  String get markComplete;

  /// No description provided for @confirmCompletion.
  ///
  /// In en, this message translates to:
  /// **'Confirm Completion'**
  String get confirmCompletion;

  /// No description provided for @completionNotes.
  ///
  /// In en, this message translates to:
  /// **'Completion Notes'**
  String get completionNotes;

  /// No description provided for @workSummary.
  ///
  /// In en, this message translates to:
  /// **'Work Summary'**
  String get workSummary;

  /// No description provided for @payment.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get payment;

  /// No description provided for @paymentSetup.
  ///
  /// In en, this message translates to:
  /// **'Payment Setup'**
  String get paymentSetup;

  /// No description provided for @totalCharged.
  ///
  /// In en, this message translates to:
  /// **'Total Charged'**
  String get totalCharged;

  /// No description provided for @platformFee.
  ///
  /// In en, this message translates to:
  /// **'Platform Fee'**
  String get platformFee;

  /// No description provided for @sellerPayout.
  ///
  /// In en, this message translates to:
  /// **'Seller Payout'**
  String get sellerPayout;

  /// No description provided for @estimatedPayout.
  ///
  /// In en, this message translates to:
  /// **'Estimated Payout'**
  String get estimatedPayout;

  /// No description provided for @noMessages.
  ///
  /// In en, this message translates to:
  /// **'No messages yet'**
  String get noMessages;

  /// No description provided for @typeMessage.
  ///
  /// In en, this message translates to:
  /// **'Type a message...'**
  String get typeMessage;

  /// No description provided for @sendMessage.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get sendMessage;

  /// No description provided for @conversations.
  ///
  /// In en, this message translates to:
  /// **'Conversations'**
  String get conversations;

  /// No description provided for @reviews.
  ///
  /// In en, this message translates to:
  /// **'Reviews'**
  String get reviews;

  /// No description provided for @writeReview.
  ///
  /// In en, this message translates to:
  /// **'Write a Review'**
  String get writeReview;

  /// No description provided for @overallRating.
  ///
  /// In en, this message translates to:
  /// **'Overall Rating'**
  String get overallRating;

  /// No description provided for @wouldRecommend.
  ///
  /// In en, this message translates to:
  /// **'Would you recommend this seller?'**
  String get wouldRecommend;

  /// No description provided for @yes.
  ///
  /// In en, this message translates to:
  /// **'Yes'**
  String get yes;

  /// No description provided for @no.
  ///
  /// In en, this message translates to:
  /// **'No'**
  String get no;

  /// No description provided for @submitReview.
  ///
  /// In en, this message translates to:
  /// **'Submit Review'**
  String get submitReview;

  /// No description provided for @sellerProfile.
  ///
  /// In en, this message translates to:
  /// **'Seller Profile'**
  String get sellerProfile;

  /// No description provided for @setupSellerProfile.
  ///
  /// In en, this message translates to:
  /// **'Set Up Seller Profile'**
  String get setupSellerProfile;

  /// No description provided for @businessName.
  ///
  /// In en, this message translates to:
  /// **'Business Name'**
  String get businessName;

  /// No description provided for @serviceRadius.
  ///
  /// In en, this message translates to:
  /// **'Service Radius'**
  String get serviceRadius;

  /// No description provided for @serviceRadiusMiles.
  ///
  /// In en, this message translates to:
  /// **'{miles} miles'**
  String serviceRadiusMiles(int miles);

  /// No description provided for @yearsExperience.
  ///
  /// In en, this message translates to:
  /// **'Years of Experience'**
  String get yearsExperience;

  /// No description provided for @businessWebsite.
  ///
  /// In en, this message translates to:
  /// **'Business Website'**
  String get businessWebsite;

  /// No description provided for @portfolioPhotos.
  ///
  /// In en, this message translates to:
  /// **'Portfolio Photos'**
  String get portfolioPhotos;

  /// No description provided for @businessHours.
  ///
  /// In en, this message translates to:
  /// **'Business Hours'**
  String get businessHours;

  /// No description provided for @saveProfile.
  ///
  /// In en, this message translates to:
  /// **'Save Profile'**
  String get saveProfile;

  /// No description provided for @verification.
  ///
  /// In en, this message translates to:
  /// **'Verification'**
  String get verification;

  /// No description provided for @verifyIdentity.
  ///
  /// In en, this message translates to:
  /// **'Verify Identity'**
  String get verifyIdentity;

  /// No description provided for @verifyLicense.
  ///
  /// In en, this message translates to:
  /// **'Verify License'**
  String get verifyLicense;

  /// No description provided for @verifyInsurance.
  ///
  /// In en, this message translates to:
  /// **'Verify Insurance'**
  String get verifyInsurance;

  /// No description provided for @backgroundCheck.
  ///
  /// In en, this message translates to:
  /// **'Background Check'**
  String get backgroundCheck;

  /// No description provided for @einVerification.
  ///
  /// In en, this message translates to:
  /// **'EIN Verification'**
  String get einVerification;

  /// No description provided for @uploadDocuments.
  ///
  /// In en, this message translates to:
  /// **'Upload Documents'**
  String get uploadDocuments;

  /// No description provided for @verificationPending.
  ///
  /// In en, this message translates to:
  /// **'Verification Pending'**
  String get verificationPending;

  /// No description provided for @verified.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get verified;

  /// No description provided for @notVerified.
  ///
  /// In en, this message translates to:
  /// **'Not Verified'**
  String get notVerified;

  /// No description provided for @payoutSetup.
  ///
  /// In en, this message translates to:
  /// **'Sorcyn Pay Setup'**
  String get payoutSetup;

  /// No description provided for @payoutSetupDesc.
  ///
  /// In en, this message translates to:
  /// **'Set up Sorcyn Pay to start receiving payments'**
  String get payoutSetupDesc;

  /// No description provided for @startOnboarding.
  ///
  /// In en, this message translates to:
  /// **'Start Onboarding'**
  String get startOnboarding;

  /// No description provided for @onboardingComplete.
  ///
  /// In en, this message translates to:
  /// **'Payment setup complete!'**
  String get onboardingComplete;

  /// No description provided for @onboardingPending.
  ///
  /// In en, this message translates to:
  /// **'Onboarding in progress...'**
  String get onboardingPending;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Search posts...'**
  String get searchHint;

  /// No description provided for @noResults.
  ///
  /// In en, this message translates to:
  /// **'No results found'**
  String get noResults;

  /// No description provided for @filters.
  ///
  /// In en, this message translates to:
  /// **'Filters'**
  String get filters;

  /// No description provided for @sortBy.
  ///
  /// In en, this message translates to:
  /// **'Sort by'**
  String get sortBy;

  /// No description provided for @newest.
  ///
  /// In en, this message translates to:
  /// **'Newest'**
  String get newest;

  /// No description provided for @oldest.
  ///
  /// In en, this message translates to:
  /// **'Oldest'**
  String get oldest;

  /// No description provided for @expiringSoon.
  ///
  /// In en, this message translates to:
  /// **'Expiring Soon'**
  String get expiringSoon;

  /// No description provided for @budgetHigh.
  ///
  /// In en, this message translates to:
  /// **'Budget: High to Low'**
  String get budgetHigh;

  /// No description provided for @budgetLow.
  ///
  /// In en, this message translates to:
  /// **'Budget: Low to High'**
  String get budgetLow;

  /// No description provided for @mostOffers.
  ///
  /// In en, this message translates to:
  /// **'Most Offers'**
  String get mostOffers;

  /// No description provided for @priceLow.
  ///
  /// In en, this message translates to:
  /// **'Price: Low to High'**
  String get priceLow;

  /// No description provided for @priceHigh.
  ///
  /// In en, this message translates to:
  /// **'Price: High to Low'**
  String get priceHigh;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @confirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @done.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get loading;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// No description provided for @success.
  ///
  /// In en, this message translates to:
  /// **'Success'**
  String get success;

  /// No description provided for @warning.
  ///
  /// In en, this message translates to:
  /// **'Warning'**
  String get warning;

  /// No description provided for @noData.
  ///
  /// In en, this message translates to:
  /// **'No data available'**
  String get noData;

  /// No description provided for @somethingWentWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get somethingWentWrong;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Please try again'**
  String get tryAgain;

  /// No description provided for @areYouSure.
  ///
  /// In en, this message translates to:
  /// **'Are you sure?'**
  String get areYouSure;

  /// No description provided for @cannotBeUndone.
  ///
  /// In en, this message translates to:
  /// **'This action cannot be undone.'**
  String get cannotBeUndone;

  /// No description provided for @bio.
  ///
  /// In en, this message translates to:
  /// **'Bio'**
  String get bio;

  /// No description provided for @editProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get editProfile;

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change Password'**
  String get changePassword;

  /// No description provided for @currentPassword.
  ///
  /// In en, this message translates to:
  /// **'Current Password'**
  String get currentPassword;

  /// No description provided for @newPassword.
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get newPassword;

  /// No description provided for @passwordChanged.
  ///
  /// In en, this message translates to:
  /// **'Password changed successfully'**
  String get passwordChanged;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View All'**
  String get viewAll;

  /// No description provided for @seeMore.
  ///
  /// In en, this message translates to:
  /// **'See More'**
  String get seeMore;

  /// No description provided for @showLess.
  ///
  /// In en, this message translates to:
  /// **'Show Less'**
  String get showLess;

  /// No description provided for @individual.
  ///
  /// In en, this message translates to:
  /// **'Individual'**
  String get individual;

  /// No description provided for @invoiceAvailable.
  ///
  /// In en, this message translates to:
  /// **'Invoice Available'**
  String get invoiceAvailable;

  /// No description provided for @bulkQuantity.
  ///
  /// In en, this message translates to:
  /// **'Bulk Quantity'**
  String get bulkQuantity;

  /// No description provided for @minimumOrder.
  ///
  /// In en, this message translates to:
  /// **'Minimum Order'**
  String get minimumOrder;

  /// No description provided for @wholesalePrice.
  ///
  /// In en, this message translates to:
  /// **'Wholesale Price'**
  String get wholesalePrice;

  /// No description provided for @liquidation.
  ///
  /// In en, this message translates to:
  /// **'Liquidation'**
  String get liquidation;

  /// No description provided for @noPosts.
  ///
  /// In en, this message translates to:
  /// **'No posts yet'**
  String get noPosts;

  /// No description provided for @noPostsDesc.
  ///
  /// In en, this message translates to:
  /// **'Create your first post to get started'**
  String get noPostsDesc;

  /// No description provided for @noOffersDesc.
  ///
  /// In en, this message translates to:
  /// **'You haven\'t submitted any offers yet'**
  String get noOffersDesc;

  /// No description provided for @noTransactions.
  ///
  /// In en, this message translates to:
  /// **'No transactions yet'**
  String get noTransactions;

  /// No description provided for @noConversations.
  ///
  /// In en, this message translates to:
  /// **'No conversations yet'**
  String get noConversations;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'ar',
    'en',
    'es',
    'fr',
    'hi',
    'ja',
    'ko',
    'pt',
    'vi',
    'zh',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
    case 'hi':
      return AppLocalizationsHi();
    case 'ja':
      return AppLocalizationsJa();
    case 'ko':
      return AppLocalizationsKo();
    case 'pt':
      return AppLocalizationsPt();
    case 'vi':
      return AppLocalizationsVi();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
