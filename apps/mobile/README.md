# Orderbook mobile

Expo React Native app for the orderbook exchange.

## Design rules

- **No `Alert.alert`.** Confirmations go through `dialog.confirm({ title, message, confirmLabel, cancelLabel, destructive, dismissable })` from `store/dialog.ts`, rendered by the single `DialogHost` mounted next to `ToastHost` in `app/_layout.tsx`. It resolves `true` on confirm and `false` on cancel, backdrop tap or Android back.
- **Menus are action sheets.** A button that offers several options opens an in-screen bottom sheet with a dimmed backdrop, a rounded top and one row per option, never a multi-button alert.
- **Form sheets** use `presentation: 'formSheet'` with `sheetAllowedDetents: 'fitToContents'` and `sheetCornerRadius: Radius['2xl']`. Android draws square corners without the radius. Use a fixed detent only for long scrolling sheets.
- **Sheets with inputs** never use `KeyboardAvoidingView` or `KeyboardAwareScrollView`. The Android form sheet already lifts above the keyboard, so a second keyboard spacer leaves an empty band. Use `SheetLayout`: header, scroll body, and a footer holding the main action. While the keyboard is open its height is capped to the space above the keyboard, so the body scrolls and the footer stays visible.
- **Buttons** are 44pt (`md`) for full-width, form and footer actions; compact row actions use 36pt (`sm`). There is no larger size. Footer bars pad 12pt above and below the button, plus the bottom inset.
- **Swipe actions** on list rows, if added: 40pt square tiles with a 10pt radius, centred vertically, 8pt gaps, the last tile flush right, and opacity 0 until the swipe starts (Reanimated progress interpolated from 0 to 0.3) so they never show through a translucent selected row.
