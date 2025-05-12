#!/bin/bash

get_version() {
    cargo pkgid | cut -d'#' -f2
}

name='xdwlan-login'
version=$(get_version)
target='x86_64-unknown-linux-gnu'
dist_name="$name-$target"

dist_dir='dist'
version_dir="$dist_dir/$version"
archive_dir="$version_dir/$dist_name"
archive_name="$version_dir/$dist_name.tar.xz"

# Build rust program
cargo build --release --target $target

# Build bun program
[ ! -d "node_modules" ] && bun install
bun build:linux:release

# Prepare dist folder
[ ! -d "$dist_dir" ] && mkdir "$dist_dir"
[ -d "$archive_dir" ] && rm -r "$archive_dir"
mkdir -p "$archive_dir"

# Create archive
[ -f "$archive_name" ] && rm "$archive_name"
cp "target/$target/release/xdwlan-login" "$archive_dir"
cp "target/$target/release/xdwlan-login-worker" "$archive_dir"
cat <<EOF > "$archive_dir/config.yaml"
username: "23xxxxxxxxx" # 学号
password: "***********" # 密码
domain: "" # 留空表示默认，中国移动填 "@yd"，中国联通填 "@lt"，中国电信填 "@dx"
EOF
tar cf - -C "$version_dir" "$dist_name" | xz > "$archive_name"