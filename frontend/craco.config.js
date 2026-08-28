// CRA 5.0.1 hardcodes `tailwindcss` as a PostCSS plugin whenever it sees a
// tailwind.config.js (react-scripts/config/webpack.config.js). Tailwind v4
// rejects that — it needs @tailwindcss/postcss instead — so the build fails
// before it starts.
//
// mode: "file" tells CRACO to use this project's own postcss.config.js,
// which already names the right plugin, instead of CRA's hardcoded list.
module.exports = {
  style: {
    postcss: {
      mode: "file",
    },
  },
};
