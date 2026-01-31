const runPlaceholder = ({ commandName, detail, extraLines }) => {
  const lines = [
    `TODO: implement ${commandName}.`,
    detail ? `Expected: ${detail}.` : null,
    ...(extraLines ?? []),
    "See docs/airline-protocol-v1.md."
  ].filter(Boolean);

  console.log(lines.join("\n"));
  process.exit(1);
};

export { runPlaceholder };
