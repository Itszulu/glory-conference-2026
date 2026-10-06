import sharp from "sharp";
import fs from "fs";
import path from "path";

const jobs = [
  // Branding — preserve transparency
  {
    input: "public/assets/branding/glory-conference-logo.png",
    output: "public/assets/branding/glory-conference-logo.webp",
    width: 1200,
    quality: 90
  },
  {
    input: "public/assets/branding/the-outpouring.png",
    output: "public/assets/branding/the-outpouring.webp",
    width: 1600,
    quality: 90
  },

  // Ministers
  {
    input: "public/assets/ministers/chinyere-udoma.PNG",
    output: "public/assets/ministers/chinyere-udoma.webp",
    width: 1400,
    quality: 85
  },
  {
    input: "public/assets/ministers/chris-okolo.png",
    output: "public/assets/ministers/chris-okolo.webp",
    width: 1400,
    quality: 85
  },
  {
    input: "public/assets/ministers/joshua-ohanye.jpeg",
    output: "public/assets/ministers/joshua-ohanye.webp",
    width: 1600,
    quality: 85
  },

  // Main conference photograph
  {
    input: "public/assets/backgrounds/glory-conference-official.jpg",
    output: "public/assets/backgrounds/glory-conference-official.webp",
    width: 1800,
    quality: 84
  },

  // Gallery
  ...Array.from({ length: 6 }, (_, i) => {
    const number = String(i + 1).padStart(2, "0");

    return {
      input: `public/assets/gallery/glory-${number}.jpg`,
      output: `public/assets/gallery/glory-${number}.webp`,
      width: 1200,
      quality: 82
    };
  })
];

async function optimize() {
  console.log("\nGLORY CONFERENCE — IMAGE OPTIMIZATION\n");

  for (const job of jobs) {
    if (!fs.existsSync(job.input)) {
      console.log(`SKIPPED: ${job.input} not found`);
      continue;
    }

    const originalSize = fs.statSync(job.input).size;

    await sharp(job.input)
      .rotate()
      .resize({
        width: job.width,
        withoutEnlargement: true
      })
      .webp({
        quality: job.quality,
        effort: 6
      })
      .toFile(job.output);

    const optimizedSize = fs.statSync(job.output).size;

    const originalMB = (originalSize / 1024 / 1024).toFixed(2);
    const optimizedMB = (optimizedSize / 1024 / 1024).toFixed(2);
    const saving = Math.round(
      (1 - optimizedSize / originalSize) * 100
    );

    console.log(
      `${path.basename(job.input)}: ${originalMB} MB -> ${optimizedMB} MB (${saving}% smaller)`
    );
  }

  console.log("\nOptimization complete.");
  console.log("Original files were NOT deleted.\n");
}

optimize().catch((error) => {
  console.error("\nOptimization failed:");
  console.error(error);
  process.exit(1);
});