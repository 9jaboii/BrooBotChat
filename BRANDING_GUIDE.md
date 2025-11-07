# BrooBot Branding Guide

## Logo Integration

The BrooBot logo has been fully integrated throughout the application to ensure consistent branding across all touchpoints.

## Logo Files

### Primary Logo
- **Location**: `/public/broobot-logo.png`
- **Format**: PNG (384KB)
- **Usage**: All UI components, favicon, and meta tags

## Logo Component

A reusable `<Logo />` component has been created for consistent usage throughout the application.

**Location**: `src/components/Logo.tsx`

### Usage

```tsx
import { Logo } from '@components/Logo';

// Full logo with text
<Logo variant="full" size="medium" />

// Icon only (no text)
<Logo variant="icon" size="small" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'full' \| 'icon'` | `'full'` | Display full logo with text or icon only |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the logo |
| `className` | `string` | `''` | Additional CSS classes |

### Size Reference

- **Small**: 24px height - Used for compact spaces
- **Medium**: 40px height - Used in sidebar
- **Large**: 60px height - Used in auth pages

## Logo Placements

### ✅ 1. Sidebar
- **Component**: `src/components/Sidebar.tsx`
- **Implementation**: Full logo with text
- **Size**: Medium (40px)
- **Location**: Top of sidebar header

### ✅ 2. Sign In Page
- **Component**: `src/pages/SignIn.tsx`
- **Implementation**: Full logo with text
- **Size**: Large (80px on desktop, 60px on mobile)
- **Location**: Top center of auth card

### ✅ 3. Sign Up Page
- **Component**: `src/pages/SignUp.tsx`
- **Implementation**: Full logo with text
- **Size**: Large (80px on desktop, 60px on mobile)
- **Location**: Top center of auth card

### ✅ 4. Favicon
- **File**: `index.html`
- **Implementation**: PNG favicon
- **Formats**:
  - Standard favicon: `/broobot-logo.png`
  - Apple touch icon: `/broobot-logo.png`

### ✅ 5. Meta Tags (Social Sharing)
- **File**: `index.html`
- **Usage**: Open Graph and Twitter Card images
- **Image**: `/broobot-logo.png`

## Styling

Logo-specific styles are located in `src/styles/Logo.css`.

### Key Style Features

1. **Responsive sizing**: Adjusts based on screen size
2. **Proper aspect ratio**: Maintains logo proportions
3. **Consistent spacing**: Uniform gaps and margins
4. **Color coordination**: Matches brand colors

### CSS Classes

- `.logo-container` - Main wrapper
- `.logo-image` - The image element
- `.logo-text` - Text accompanying the logo
- `.logo-full` - Full logo variant
- `.logo-icon` - Icon-only variant
- `.logo-small`, `.logo-medium`, `.logo-large` - Size variants

## Brand Colors

The logo uses the primary brand color scheme:

```css
--primary-color: #10a37f;
--primary-hover: #0d8c6d;
```

## Responsive Behavior

### Desktop (> 768px)
- Full logo displayed with text
- Larger sizes for better visibility
- All logo instances visible

### Mobile (< 768px)
- Logo scales appropriately
- Maintains readability
- Sidebar logo adjusts size

### Tablet (768px - 1024px)
- Medium-sized logos
- Full functionality maintained

## Best Practices

### Do's ✅
- Use the `<Logo />` component for all logo instances
- Maintain aspect ratio
- Use appropriate size variants
- Keep logo visible and unobstructed
- Ensure sufficient contrast with background

### Don'ts ❌
- Don't stretch or distort the logo
- Don't use text instead of the logo component
- Don't change logo colors (unless dark mode)
- Don't use low-resolution versions
- Don't add effects (shadows, gradients) to logo

## Adding Logo to New Components

When adding the logo to a new component:

1. **Import the Logo component**:
```tsx
import { Logo } from '@components/Logo';
```

2. **Use appropriate size**:
```tsx
<Logo variant="full" size="medium" />
```

3. **Add container if needed**:
```tsx
<div className="my-logo-container">
  <Logo variant="full" size="medium" />
</div>
```

## Future Enhancements

### Recommended Additions

1. **Dark Mode Logo**
   - Create inverted version for dark backgrounds
   - Implement in Logo component

2. **Animated Logo**
   - Loading state animation
   - Hover effects for interactive elements

3. **Multiple Formats**
   - SVG version for scalability
   - WebP for better compression
   - Different resolutions for various use cases

4. **Logo Variations**
   - Square version for social media
   - Horizontal version for wide spaces
   - Monochrome version for print

## Accessibility

The logo implementation includes accessibility features:

- **Alt text**: "BrooBot Logo" on all images
- **Semantic HTML**: Proper heading structure
- **Contrast**: Meets WCAG AA standards
- **Keyboard navigation**: Focusable where interactive

## SEO Optimization

Logo is optimized for search engines:

- Open Graph meta tags for social sharing
- Twitter Card meta tags
- Proper alt text for image SEO
- Structured data (future enhancement)

## File Management

### Current Files
```
public/
├── broobot-logo.png (384KB) - Primary logo
└── vite.svg - Vite default (can be removed)

src/
├── components/
│   └── Logo.tsx - Logo component
└── styles/
    └── Logo.css - Logo styles
```

### Cleanup
You can safely remove `public/vite.svg` if no longer needed.

## Testing Checklist

When testing logo integration:

- [ ] Logo displays on Sidebar
- [ ] Logo displays on Sign In page
- [ ] Logo displays on Sign Up page
- [ ] Favicon appears in browser tab
- [ ] Logo maintains aspect ratio on all screen sizes
- [ ] Logo is visible on both light and dark backgrounds
- [ ] Social sharing preview shows logo
- [ ] Logo loads without errors
- [ ] Logo is crisp and clear (no pixelation)
- [ ] Logo text is readable at all sizes

## Support

For questions about logo usage or branding:
1. Review this guide
2. Check Logo component code
3. Inspect CSS styles
4. Contact development team

---

**Last Updated**: November 7, 2025
**Logo Version**: 1.0
**Next Review**: When adding new features or pages
