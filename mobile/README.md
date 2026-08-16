# Mobile App (Flutter)

This directory will contain the **Flutter mobile app** for iOS and Android.

## Status: 🔜 Phase 3 (after Admin Panel is ready for content)

### Planned Structure

```
mobile/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── app.dart                     # MaterialApp + Riverpod + routing
│   ├── core/
│   │   ├── supabase/
│   │   │   └── supabase_service.dart  # Supabase client singleton
│   │   ├── theme/
│   │   │   ├── app_theme.dart         # Colors, typography, RTL config
│   │   │   └── fonts.dart             # Arabic, Hebrew, Greek font setup
│   │   └── router/
│   │       └── app_router.dart        # go_router navigation
│   ├── features/
│   │   ├── navigation/              # Testament → Book → Chapter
│   │   │   ├── screens/
│   │   │   │   ├── testament_screen.dart
│   │   │   │   ├── book_list_screen.dart
│   │   │   │   └── chapter_list_screen.dart
│   │   │   └── providers/
│   │   ├── reader/                  # Chapter reader (dual text)
│   │   │   ├── screens/
│   │   │   │   └── chapter_reader_screen.dart
│   │   │   ├── widgets/
│   │   │   │   ├── verse_card.dart
│   │   │   │   └── dual_text_view.dart
│   │   │   └── providers/
│   │   ├── word_study/             # Interlinear table
│   │   │   ├── screens/
│   │   │   │   └── word_study_screen.dart
│   │   │   ├── widgets/
│   │   │   │   ├── word_row.dart
│   │   │   │   └── audio_button.dart
│   │   │   └── providers/
│   │   ├── strongs/                # Strong's modal
│   │   │   └── widgets/
│   │   │       └── strongs_modal.dart
│   │   └── search/                 # Arabic text search
│   │       └── screens/
│   │           └── search_screen.dart
│   └── shared/
│       └── widgets/
│           └── arabic_text.dart    # RTL-aware Arabic text widget
├── pubspec.yaml
└── README.md
```

### Key Flutter Dependencies

```yaml
dependencies:
  supabase_flutter: ^2.x      # Database + Auth
  flutter_riverpod: ^2.x      # State management
  riverpod_annotation: ^2.x   # Code generation
  go_router: ^13.x            # Navigation
  just_audio: ^0.9.x          # Audio playback
  cached_network_image: ^3.x  # Image caching
  google_fonts: ^6.x          # Font loading
```
