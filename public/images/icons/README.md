# Currency Icons

Place the WoWHead-style currency icon files here:

- `money-gold.gif` - Gold coin icon
- `money-silver.gif` - Silver coin icon  
- `money-copper.gif` - Copper coin icon

These files should be the actual currency icons from WoWHead or similar WoW database sites.

## File Requirements

- Format: GIF (as used by WoWHead)
- Size: Recommended 12x12 pixels (will be scaled automatically)
- Background: Transparent or matching the site theme

## Usage

The icons are automatically applied via CSS classes:
- `.moneygold` - for gold amounts
- `.moneysilver` - for silver amounts  
- `.moneycopper` - for copper amounts

These classes add the appropriate icon as a background image with right padding.
