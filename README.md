# MinecraftUtils

MinecraftUtils is a collection of Minecraft utilities, tools, generators and references built for players, server admins, developers, and enthusiasts. The site hosts popular tools like Inventory Slots, XP Calculators, Nether Coordinate Converters, and a list of many external utilities.

The project is maintained by Fy17 and contributors.
If you want to support the project or chat with the team, join our Discord:

### https://discord.gg/tqn38v6w7k

---

## Contributing
`minecraftutils.com` is an open source website, and all developers are allowed to contribute to it. All edits are to be done in a fork using pull requests, or in a separate branch to avoid issues. All contributors are appreciated! 

### Project uses:
- Next.js v16.0.7
- React v19.2.1
- Tailwind CSS v4
- TypeScript v5
- Tabler Icons v3.35.0
- Lucide Icons v0.555.0
- ESLint v9

Some components are also based on premade shadcn components, with some edits made.

### Setup
To set up the project locally, clone it from GitHub and run `npm install`.

To run it locally, use `npm run dev`.

### Component System
We use reusable UI components across the site for a consistent look.

Examples:

**Button**

```tsx
<Button variant="outline" size="sm">My Button</Button>
```
**Card**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
</Card>
```
You most likely won't have to make edits to these components, or install new ones. If you need to, please consider consulting someone first, or making sure it keeps the standard.

### Adding a New Tool / Util
To define a new tool, start by opening `app/AppStructure.tsx`, here the list of all utilities are defined. 

Each utility gets its own folder under the correct category in `/app`. All components are to be in this folder.

For more reference, look at the other utilities already added, or ask for help in the discord server.

Make sure to always use the same theme, the same base-components when possible, and some nice looking Tabler icons!

### Images
All image assets are to be located under an appropriate folder inside `/assets`. When referencing the images inside your tool, do NOT use a direct path, instead use the:
- `@/lib/images/getImageAsset` - when the name is known, a static string
- `@/lib/images/findImageAsset` - when its dynamic, it also takes a fallback directory, which is the inner path name

For example, an image like `/assets/minecraft/item/tools/bow.png` can be accessed by `findImageAsset("bow", "tools")`, where "tools" just helps it find the correct one in the case of duplicates.

All image paths are defined inside `/lib/images/itemAssets.ts`, this file should not be manually edited. When editing an image, please run `npm run assets` or `npm run assets:all` to refresh the file.

**Thanks for contributing!**