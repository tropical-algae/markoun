{
  buildNpmPackage,
  importNpmLock,
  nodejs_24,
  version,
}:
(buildNpmPackage.override { nodejs = nodejs_24; }) {
  pname = "markoun-web";
  inherit version;

  src = ../web;
  npmDeps = importNpmLock { npmRoot = ../web; };
  npmConfigHook = importNpmLock.npmConfigHook;

  npmBuildScript = "build";

  installPhase = ''
    runHook preInstall

    mkdir -p $out/share/markoun/web
    cp -r dist/. $out/share/markoun/web/

    runHook postInstall
  '';
}
