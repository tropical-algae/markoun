{
  buildNpmPackage,
  lib,
  nodejs_24,
  version,
}:
(buildNpmPackage.override { nodejs = nodejs_24; }) {
  pname = "markoun-web";
  inherit version;

  src = ../web;
  npmDepsHash = "sha256-LXqF6qyMm+ngQPB7BPY4JI9VRGBQR8OAZBxINROWE2A=";

  npmBuildScript = "build";

  installPhase = ''
    runHook preInstall

    mkdir -p $out/share/markoun/web
    cp -r dist/. $out/share/markoun/web/

    runHook postInstall
  '';
}
