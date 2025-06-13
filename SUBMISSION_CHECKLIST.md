# Chrome Web Store Submission Checklist

Use this checklist to ensure all requirements are met before submitting the Academic Access Extension to the Chrome Web Store.

## Code Preparation

- [ ] Run `npm run build` to create production build
- [ ] Verify manifest.json has correct version number (1.0.0)
- [ ] Ensure CSP in manifest.json is compliant with Chrome's requirements
- [ ] Remove all console.log statements from production code
- [ ] Check for and remove any debugging code
- [ ] Verify all permissions are properly declared in manifest.json
- [ ] Test the production build locally

## Assets Preparation

- [ ] Create ZIP file of dist directory contents
- [ ] Prepare icon (128x128 PNG)
- [ ] Create 4-5 screenshots (1280x800 or 640x400)
- [ ] Design promotional images:
  - [ ] Small promotional tile (440x280)
  - [ ] Large promotional tile (920x680)
  - [ ] Marquee promotional tile (optional)

## Documentation

- [ ] Finalize README.md
- [ ] Complete CHANGELOG.md
- [ ] Publish Privacy Policy online and record URL
- [ ] Host documentation website (optional)

## Testing

- [ ] Test on Chrome stable channel
- [ ] Test on Chrome beta channel (optional)
- [ ] Cross-platform testing (Windows, Mac, Linux)
- [ ] Test all core functionality:
  - [ ] Institution selection and configuration
  - [ ] Paywall detection
  - [ ] Proxy redirection
  - [ ] Open access fallback
  - [ ] History tracking
- [ ] Test edge cases:
  - [ ] First-time use experience
  - [ ] Multiple institutions
  - [ ] Error handling
  - [ ] Network failures

## Store Listing Content

- [ ] Prepare extension name
- [ ] Write concise summary (132 char max)
- [ ] Complete detailed description
- [ ] Select categories (Education, Productivity)
- [ ] Prepare support email address
- [ ] Set up support website
- [ ] Review all content for typos and grammar

## Legal and Compliance

- [ ] Review Chrome Web Store Developer Program Policies
- [ ] Verify compliance with User Data Privacy policy
- [ ] Confirm license information for all third-party libraries
- [ ] Complete privacy policy
- [ ] Prepare permissions justification document

## Developer Account

- [ ] Create/verify Google Developer account
- [ ] Set up two-factor authentication
- [ ] Have payment method ready for registration fee ($5)
- [ ] Complete tax information if applicable
- [ ] Verify contact information is current

## Post-Submission Preparation

- [ ] Prepare release announcement
- [ ] Set up monitoring for store reviews
- [ ] Create support response templates
- [ ] Plan for first update/bug fix release

## Final Verification

- [ ] All documents reviewed for accuracy
- [ ] All required files included in ZIP package
- [ ] Extension functions correctly in production mode
- [ ] Privacy and data handling statements are accurate
- [ ] All store listing content is finalized