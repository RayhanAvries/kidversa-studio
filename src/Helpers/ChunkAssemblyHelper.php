<?php

declare(strict_types=1);

namespace Kidversa\Helpers;

use Kidversa\Helpers\ValidationHelper;

class ChunkAssemblyHelper
{
    private const CHUNK_DIR = __DIR__ . '/../../storage/chunks';

    public static function initSession(string $uploadId, string $filename, int $totalChunks, int $totalSize): array
    {
        $sessionDir = self::getChunkDir($uploadId);
        if (!is_dir($sessionDir)) {
            mkdir($sessionDir, 0755, true);
        }

        $meta = [
            'upload_id' => $uploadId,
            'filename' => $filename,
            'total_chunks' => $totalChunks,
            'total_size' => $totalSize,
            'received_chunks' => 0,
            'created_at' => time(),
            'status' => 'uploading',
        ];

        file_put_contents($sessionDir . '/meta.json', json_encode($meta));

        return $meta;
    }

    public static function addChunk(string $uploadId, int $chunkIndex, string $chunkData): bool
    {
        $sessionDir = self::getChunkDir($uploadId);
        $metaPath = $sessionDir . '/meta.json';

        if (!file_exists($metaPath)) {
            return false;
        }

        $fp = fopen($metaPath, 'r+');
        if (!$fp) {
            return false;
        }

        flock($fp, LOCK_EX);

        $meta = json_decode(stream_get_contents($fp), true);
        if ($meta['status'] !== 'uploading') {
            flock($fp, LOCK_UN);
            fclose($fp);
            return false;
        }

        $chunkPath = $sessionDir . '/chunk_' . str_pad((string) $chunkIndex, 6, '0', STR_PAD_LEFT);
        file_put_contents($chunkPath, $chunkData);

        $meta['received_chunks'] = ($meta['received_chunks'] ?? 0) + 1;

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($meta));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);

        return true;
    }

    public static function assemble(string $uploadId): ?string
    {
        $sessionDir = self::getChunkDir($uploadId);
        $metaPath = $sessionDir . '/meta.json';

        if (!file_exists($metaPath)) {
            return null;
        }

        $meta = json_decode(file_get_contents($metaPath), true);

        if ($meta['received_chunks'] !== $meta['total_chunks']) {
            return null;
        }

        if (!ValidationHelper::validateFilename($meta['filename'])) {
            return null;
        }

        $uploadDir = FileHelper::getUploadDir();
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $finalPath = $uploadDir . '/' . $meta['filename'];
        $tmpPath = $finalPath . '.tmp.' . getmypid();

        $handle = fopen($tmpPath, 'w');
        if (!$handle) {
            return null;
        }

        for ($i = 0; $i < $meta['total_chunks']; $i++) {
            $chunkPath = $sessionDir . '/chunk_' . str_pad((string) $i, 6, '0', STR_PAD_LEFT);
            if (!file_exists($chunkPath)) {
                fclose($handle);
                unlink($tmpPath);
                return null;
            }
            $chunkHandle = fopen($chunkPath, 'r');
            if ($chunkHandle) {
                while (!feof($chunkHandle)) {
                    fwrite($handle, fread($chunkHandle, 8192));
                }
                fclose($chunkHandle);
            }
        }

        fclose($handle);

        if (!rename($tmpPath, $finalPath)) {
            unlink($tmpPath);
            return null;
        }

        $meta['status'] = 'completed';
        file_put_contents($metaPath, json_encode($meta));

        self::cleanup($uploadId);

        return $meta['filename'];
    }

    public static function getProgress(string $uploadId): ?array
    {
        $sessionDir = self::getChunkDir($uploadId);
        $metaPath = $sessionDir . '/meta.json';

        if (!file_exists($metaPath)) {
            return null;
        }

        $meta = json_decode(file_get_contents($metaPath), true);

        return [
            'received' => $meta['received_chunks'],
            'total' => $meta['total_chunks'],
            'percent' => (int) round(($meta['received_chunks'] / $meta['total_chunks']) * 100),
            'status' => $meta['status'],
        ];
    }

    public static function cleanup(string $uploadId): void
    {
        $sessionDir = self::getChunkDir($uploadId);
        if (is_dir($sessionDir)) {
            $files = glob($sessionDir . '/*');
            foreach ($files as $file) {
                unlink($file);
            }
            rmdir($sessionDir);
        }
    }

    public static function cleanupStale(int $maxAge = 3600): void
    {
        $chunkBase = self::CHUNK_DIR;
        if (!is_dir($chunkBase)) {
            return;
        }

        $dirs = glob($chunkBase . '/*', GLOB_ONLYDIR);
        $now = time();

        foreach ($dirs as $dir) {
            $metaPath = $dir . '/meta.json';
            if (file_exists($metaPath)) {
                $meta = json_decode(file_get_contents($metaPath), true);
                if (($now - ($meta['created_at'] ?? 0)) > $maxAge) {
                    self::cleanup(basename($dir));
                }
            }
        }
    }

    private static function getChunkDir(string $uploadId): string
    {
        return self::CHUNK_DIR . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $uploadId);
    }
}
