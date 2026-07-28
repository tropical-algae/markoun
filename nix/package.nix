{
  backend,
  lib,
  makeWrapper,
  ripgrep,
  symlinkJoin,
  version,
}:
symlinkJoin {
  name = "markoun-${version}";
  paths = [
    backend
  ];

  nativeBuildInputs = [ makeWrapper ];

  postBuild = ''
    wrapProgram $out/bin/markoun \
      --prefix PATH : ${lib.makeBinPath [ ripgrep ]} \
      --set-default MARKOUN_DEPLOYMENT_MODE "nix"
  '';

  meta = {
    description = "A self-hosted, file-based Markdown editor";
    homepage = "https://github.com/tropical-algae/markoun";
    license = lib.licenses.mit;
    mainProgram = "markoun";
    platforms = lib.platforms.unix;
  };
}
