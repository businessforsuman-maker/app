import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import axios from "axios";
import * as cheerio from "cheerio";

export const validatorRouter = router({
  validateUrl: publicProcedure
    .input(
      z.object({
        animelok_id: z.string(),
        animerulz_id: z.string(),
        language: z.string(),
        episode: z.number().default(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Fetch from AnimeLok API
        const apiUrl = `https://animelok.streamindia.co.in/api/anime?id=${input.animelok_id}&ep=${input.episode}`;

        const response = await axios.get(apiUrl, {
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        const videoUrl = response.data?.multi || response.data?.url;

        if (!videoUrl) {
          return {
            url: "",
            isValid: false,
            error: "No video URL returned from API",
            responseStatus: response.status,
          };
        }

        // Fetch the video URL and check for errors using Cheerio
        try {
          const videoResponse = await axios.get(videoUrl, {
            timeout: 10000,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          const html = videoResponse.data;

          // Check for error indicators using Cheerio
          const $ = cheerio.load(html);

          // Extract text content to check for errors
          const pageText = $.text();
          const htmlContent = html.toLowerCase();

          // Check for specific error patterns that indicate "Video not found"
          const errorIndicators = [
            // Exact error message
            "video not found",
            // Error page indicators
            "<h1>error</h1>",
            "<p>video not found.</p>",
            // Alternative error messages
            "video unavailable",
            "content not available",
            "access denied",
            "forbidden",
            "404 not found",
            // HTML structure patterns
            '<div id="sun"><h1>error</h1>',
            // Generic error indicators
            "error page",
            "page not found",
          ];

          // Check if any error indicator is present
          const hasError = errorIndicators.some(indicator =>
            htmlContent.includes(indicator.toLowerCase())
          );

          // Also check for error-related HTML elements
          const errorElements = $(
            "h1:contains('Error'), p:contains('Video not found'), p:contains('not found'), div.error, p.error"
          );
          const hasErrorElement = errorElements.length > 0;

          // Additional check: look for the specific error div structure
          const sunDiv = $("#sun");
          const hasErrorDiv =
            sunDiv.length > 0 &&
            sunDiv.find("h1").text().toLowerCase().includes("error") &&
            sunDiv.find("p").text().toLowerCase().includes("not found");

          // Determine if valid
          // Valid if: status is 200, no error indicators, and not an error page
          const isValid =
            videoResponse.status === 200 &&
            !hasError &&
            !hasErrorElement &&
            !hasErrorDiv &&
            pageText.length > 100; // Valid pages should have substantial content

          return {
            url: videoUrl,
            isValid,
            error: isValid ? undefined : "Video not found or error detected",
            responseStatus: videoResponse.status,
          };
        } catch (videoErr) {
          // If we can't fetch the video URL, mark as invalid
          const errorMsg =
            videoErr instanceof Error ? videoErr.message : "Unknown error";
          return {
            url: videoUrl,
            isValid: false,
            error: `Failed to fetch video: ${errorMsg}`,
            responseStatus: 0,
          };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        return {
          url: "",
          isValid: false,
          error: `API request failed: ${errorMessage}`,
          responseStatus: 0,
        };
      }
    }),
});
