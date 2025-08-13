# Assets Directory

This directory contains visual assets and diagrams for the AppCompatCheck project documentation.

## Directory Structure

```
assets/
├── diagrams/              # System architecture and flow diagrams
│   ├── system-architecture.svg
│   ├── data-flow-diagram.svg
│   ├── deployment-diagram.svg
│   └── integration-flow.svg
├── screenshots/           # Application screenshots
│   ├── dashboard.png
│   ├── scan-results.png
│   ├── reports.png
│   └── admin-panel.png
├── icons/                 # Application icons and logos
│   ├── logo.svg
│   ├── favicon.ico
│   └── app-icons/
└── mockups/              # UI/UX mockups and wireframes
    ├── desktop-mockups.png
    ├── mobile-mockups.png
    └── user-flow.png
```

## Asset Guidelines

### Diagrams
- Use SVG format for scalability
- Maintain consistent color scheme (#3B82F6 for primary, #10B981 for success)
- Include clear labels and legends
- Export in high resolution for documentation

### Screenshots
- Capture in 1920x1080 resolution
- Use consistent browser and OS appearance
- Highlight key features with annotations
- Include realistic sample data

### Icons
- Maintain vector format (SVG preferred)
- Follow Material Design or similar consistent icon system
- Include multiple sizes (16px, 24px, 32px, 48px, 64px)
- Ensure accessibility with proper contrast ratios

### Mockups
- Include both desktop and mobile versions
- Show key user flows and interactions
- Use consistent branding and typography
- Export in PNG format for documentation

## Usage in Documentation

Reference assets in markdown files using relative paths:

```markdown
![System Architecture](./assets/diagrams/system-architecture.svg)
![Dashboard Screenshot](./assets/screenshots/dashboard.png)
```

## Contributing

When adding new assets:
1. Follow the naming convention (kebab-case)
2. Optimize file sizes for web usage
3. Include alt text descriptions
4. Update this README with new asset descriptions
5. Ensure all assets are properly licensed for use

## Placeholder Assets

For development purposes, placeholder assets can be generated using:
- **Diagrams**: draw.io, Lucidchart, or Mermaid
- **Screenshots**: Browser developer tools or screenshot utilities
- **Icons**: Heroicons, Feather Icons, or custom SVGs
- **Mockups**: Figma, Sketch, or Adobe XD exports

## Asset Sources

- Diagrams created with draw.io and exported as SVG
- Screenshots captured from local development environment
- Icons sourced from Heroicons and custom designs
- Mockups created in Figma and exported as PNG

---

*Note: This directory structure supports the comprehensive SDLC documentation and provides visual context for technical and business stakeholders.*