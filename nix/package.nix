{
  backend,
  frontend,
  lib,
  makeWrapper,
  ripgrep,
  stdenvNoCC,
  version,
}:
stdenvNoCC.mkDerivation {
  name = "markoun-${version}";
  dontUnpack = true;

  nativeBuildInputs = [ makeWrapper ];

  installPhase = ''
    runHook preInstall

    resourceRoot="$out/share/markoun"
    mkdir -p "$out/bin" "$resourceRoot/web"
    cp -r ${frontend}/share/markoun/web/. "$resourceRoot/web/"
    cp ${../welcome.md} "$resourceRoot/welcome.md"

    makeWrapper ${backend}/bin/markoun "$out/bin/markoun" \
      --prefix PATH : ${lib.makeBinPath [ ripgrep ]} \
      --set-default HOST "0.0.0.0" \
      --set-default PORT "8000" \
      --set-default MEDIA_DELIVERY_MODE "application" \
      --set-default WEB_ROOT "$resourceRoot/web" \
      --set-default MARKOUN_WELCOME_TEMPLATE_FILE "$resourceRoot/welcome.md" \
      --run ". ${../scripts/nix-runtime-defaults.sh}"

    runHook postInstall
  '';

  meta = {
    description = "A self-hosted, file-based Markdown editor";
    homepage = "https://github.com/tropical-algae/markoun";
    license = lib.licenses.mit;
    mainProgram = "markoun";
    platforms = lib.platforms.unix;
  };
}
